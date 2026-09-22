import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import type { PreferencesSnapshot } from "./preferences-types";
import type { OrchestratorStatus as Status } from "./orchestrator-status";
import { startSpeechMeter } from "./assistant-meter"; import { iceComplete, installReleaseGuards } from "./assistant-webrtc"; import { delegationContext, toolTaskContext } from "./assistant-context"; import { appendTranscript, readTranscript, resetTranscript } from "./assistant-transcript";
type Workspace = { id: string; label: string; project: string };
type LiveAnswer = { sessionId: string; sdp: string }; type LiveEvent = { type?: string; delta?: string; transcript?: string; delegation?: { id?: string; target?: string }; delegation_id?: string; event?: { type?: string; item?: { type?: string; call_id?: string; name?: string; arguments?: string } }; error?: { message?: string } };
type PendingCall = { callId: string; name: string; args: string };
const responseCalls = new Map<string, PendingCall[]>();
const $ = <T extends HTMLElement>(id: string): T => document.getElementById(id) as T;
let connection: RTCPeerConnection | null = null, channel: RTCDataChannel | null = null;
let microphone: MediaStream | null = null, stopMeter = () => {};
let connecting = false, listening = false, pushToTalk = false, cancellationSent = false;
let closeTimer = 0, idleTimer = 0, connectionAttempt = 0;
let activeDelegationId: string | null = null; let currentStatus: Status | null = null;
let userUtterance = "";
let lastUserUtterance = "";
let lastInputAt = 0;
let delegationQueue = Promise.resolve(); const delegations = new Set<string>();
function setStatus(status: Status): void {
  currentStatus = status; activeDelegationId = status.activeTaskId; $("connection").textContent = status.message;
  $("connection").dataset.live = String(status.liveConnected);
  $("voice-state").textContent = status.liveConnected ? (status.listening ? "Listening" : "Walking") : status.message;
  const talk = $<HTMLButtonElement>("connect");
  talk.disabled = connecting || !status.available || !status.petReady || !status.herdrConnected;
  talk.textContent = status.liveConnected ? (pushToTalk ? "Hold to talk" : "Listening") : "Connect voice";
  $<HTMLButtonElement>("disconnect").disabled = !status.liveConnected && !connecting;
  $<HTMLButtonElement>("cancel").disabled = !status.taskActive;
  $<HTMLSelectElement>("workspace").disabled = status.liveConnected;
}
function error(value: unknown): void {
  const message = String(value);
  $("error").textContent = message;
  if (message) void invoke("report_orchestrator_error", { message });
}
async function load(): Promise<void> {
  const [preferences, workspaces, status] = await Promise.all([
    invoke<PreferencesSnapshot>("get_preferences"), invoke<Workspace[]>("list_orchestrator_workspaces"),
    invoke<Status>("get_orchestrator_status"),
  ]);
  $("assistant-title").textContent = preferences.preferences.app.orchestrator.displayName;
  const workspace = $<HTMLSelectElement>("workspace");
  workspace.replaceChildren(...workspaces.map((item) => new Option(`${item.label} · ${item.project}`, item.id)));
  if (!workspaces.length) workspace.append(new Option("No Herdr workspace available", ""));
  const savedWorkspace = preferences.preferences.app.orchestrator.workspaceId;
  if (savedWorkspace && savedWorkspace.startsWith("/")) {
    if (![...workspace.options].some((option) => option.value === savedWorkspace))
      workspace.append(new Option(`Folder · ${savedWorkspace.split("/").pop() ?? savedWorkspace}`, savedWorkspace));
    workspace.value = savedWorkspace;
  } else if (savedWorkspace && workspaces.some((item) => item.id === savedWorkspace)) workspace.value = savedWorkspace;
  else if (status.workspaceId && workspaces.some((item) => item.id === status.workspaceId)) workspace.value = status.workspaceId;
  else {
    workspace.prepend(new Option("Documents (default)", ""));
    workspace.value = "";
  }
  setStatus(status);
  if (status.available && status.herdrConnected && status.wakeActivated)
    await connect(true, status.wakeGeneration);
}
async function connect(fromWake = false, wakeGeneration?: number): Promise<void> {
  if (closeTimer) {
    clearTimeout(closeTimer); closeTimer = 0;
    closeLocal(false);
  }
  if (connecting || connection) return;
  connecting = true; const attempt = ++connectionAttempt; error("");
  $<HTMLButtonElement>("connect").disabled = true; $<HTMLButtonElement>("disconnect").disabled = false;
  try {
  const workspaceSelect = $<HTMLSelectElement>("workspace");
  const workspaceId = workspaceSelect.value;
  if (!workspaceId && workspaceSelect.options.length === 0) throw new Error("Choose a running Herdr workspace first.");
  await invoke("report_orchestrator_diagnostic", { message: "requesting microphone" });
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
  });
  await invoke("report_orchestrator_diagnostic", { message: "microphone ready" });
  if (attempt !== connectionAttempt) { stream.getTracks().forEach((track) => track.stop()); return; }
  microphone = stream; stream.getAudioTracks().forEach((track) => { track.enabled = fromWake; });
  const peer = new RTCPeerConnection(); connection = peer;
  stream.getTracks().forEach((track) => peer.addTrack(track, stream));
  const remote = new Audio(); remote.autoplay = true;
  peer.addEventListener("track", (event) => { remote.srcObject = event.streams[0]; void remote.play(); });
  const events = peer.createDataChannel("oai-events"); channel = events;
  events.addEventListener("message", (event) => handleEvent(String(event.data)));
  events.addEventListener("close", closeLocal);
  const offer = await peer.createOffer();
  await peer.setLocalDescription(offer); await iceComplete(peer);
  if (attempt !== connectionAttempt) { disposeAttempt(peer, stream, events); return; }
  await invoke("report_orchestrator_diagnostic", { message: "starting Pi and GPT-Live" });
  const answer = await invoke<LiveAnswer>("start_orchestrator_session", {
    workspaceId, sdp: peer.localDescription?.sdp ?? "", wakeGeneration: wakeGeneration ?? null,
  });
  await invoke("report_orchestrator_diagnostic", { message: "GPT-Live answer received" });
  if (attempt !== connectionAttempt) { disposeAttempt(peer, stream, events); return; }
  await peer.setRemoteDescription({ type: "answer", sdp: answer.sdp });
  if (attempt !== connectionAttempt) { disposeAttempt(peer, stream, events); return; }
  pushToTalk = !fromWake;
  $<HTMLButtonElement>("connect").textContent = pushToTalk ? "Hold to talk" : "Listening";
  stopMeter = startSpeechMeter(microphone, (value) => {
    if (value !== listening) { listening = value; void invoke("set_orchestrator_listening", { value }); }
  });
  resetIdle();
  } catch (reason) {
    if (attempt === connectionAttempt) { closeLocal(); throw reason; }
  } finally { if (attempt === connectionAttempt) { connecting = false; if (currentStatus) setStatus(currentStatus); } }
}
function handleEvent(raw: string): void {
  let event: LiveEvent;
  try { event = JSON.parse(raw) as LiveEvent; } catch { return; }
  if (event.type === "session.input_transcript.delta" && event.delta) {
    resetIdle(); userUtterance += event.delta; lastInputAt = Date.now(); appendTranscript("user", event.delta);
  }
  if (event.type === "session.input_transcript.done") {
    const utterance = (event.transcript ?? userUtterance).trim(); userUtterance = "";
    if (utterance) lastUserUtterance = utterance;
    maybeCancel(utterance); }
  if (event.type === "session.output_transcript.delta" && event.delta) {
    resetIdle(); cancellationSent = false;
    if (Date.now() - lastInputAt > 2500) userUtterance = "";
    appendTranscript("assistant", event.delta);
  }
  if (event.type === "response.event") {
    resetIdle();
    handleResponseEvent(event, connectionAttempt);
  }
  if (event.type === "session.delegation.created") {
    resetIdle();
    if (event.delegation && event.delegation.target !== "client") return;
    const attempt = connectionAttempt;
    const task = userUtterance.trim() || lastUserUtterance;
    userUtterance = "";
    if (task.trim()) lastUserUtterance = task.trim();
    const cancelTarget = activeDelegationId ?? currentStatus?.activeTaskId ?? null;
    if (task.trim() && isCancelRequest(task) && cancelTarget && !cancellationSent) {
      cancellationSent = true;
      const cancelId = event.delegation?.id ?? "";
      delegationQueue = delegationQueue.then(() => cancelDelegation(event, attempt, cancelId, cancelTarget));
    } else {
      const context = delegationContext(task, readTranscript());
      delegationQueue = delegationQueue.then(() => delegate(event, attempt, context));
    }
  }
  if (event.type === "session.closed") closeLocal();
  if (event.type === "error") error(event.error?.message ?? "GPT-Live reported an error.");
}
async function delegate(event: LiveEvent, attempt: number, context: string): Promise<void> {
  const id = event.delegation?.id;
  if (attempt !== connectionAttempt || !id || event.delegation?.target !== "client" || delegations.has(id)) return;
  if (delegations.size >= 512) delegations.delete(delegations.values().next().value!);
  delegations.add(id); cancellationSent = false;
  const ownsTask = activeDelegationId === null;
  if (ownsTask) activeDelegationId = id;
  try {
    const output = await invoke<string | null>("delegate_orchestrator_task", { delegationId: id, context, full: false });
    if (attempt === connectionAttempt && output && channel?.readyState === "open") channel.send(JSON.stringify({
      type: "session.commentary.append", event_id: crypto.randomUUID(), delegation_id: id, content: output,
    }));
  } catch (reason) {
    if (attempt !== connectionAttempt) return; error(reason);
    if (channel?.readyState === "open") channel.send(JSON.stringify({
      type: "session.commentary.append", event_id: crypto.randomUUID(), delegation_id: id,
      content: "The Pi agent could not complete that request. Please try again or choose another workspace.",
    }));
  } finally { if (ownsTask && activeDelegationId === id) activeDelegationId = null; if (attempt === connectionAttempt) resetIdle(); }
}
function sendChannel(payload: unknown): boolean {
  if (channel?.readyState === "open") { channel.send(JSON.stringify(payload)); return true; }
  return false;
}
function handleResponseEvent(envelope: LiveEvent, attempt: number): void {
  const outerId = envelope.delegation_id;
  const inner = envelope.event;
  if (!outerId || !inner) return;
  if (inner.type === "response.output_item.done" && inner.item?.type === "function_call" && inner.item.call_id && inner.item.name) {
    const calls = responseCalls.get(outerId) ?? [];
    if (calls.length < 8 && !calls.some((call) => call.callId === inner.item!.call_id)) {
      calls.push({ callId: inner.item.call_id!, name: inner.item.name!, args: inner.item.arguments ?? "{}" });
      responseCalls.set(outerId, calls);
    }
    return;
  }
  if (inner.type === "response.completed") {
    const calls = responseCalls.get(outerId) ?? [];
    responseCalls.delete(outerId);
    if (calls.length) delegationQueue = delegationQueue.then(() => runBackendCalls(outerId, attempt, calls));
  }
}
async function runBackendCalls(outerId: string, attempt: number, calls: PendingCall[]): Promise<void> {
  if (attempt !== connectionAttempt || delegations.has(outerId)) return;
  if (delegations.size >= 512) delegations.delete(delegations.values().next().value!);
  delegations.add(outerId); cancellationSent = false;
  const ownsTask = activeDelegationId === null;
  if (ownsTask) activeDelegationId = outerId;
  try {
    for (const call of calls) {
      if (attempt !== connectionAttempt) return;
      const output = await executeBackendCall(outerId, call);
      sendChannel({
        type: "response.item.create", event_id: crypto.randomUUID(),
        item: { type: "function_call_output", call_id: call.callId, output },
      });
    }
    if (attempt === connectionAttempt) sendChannel({ type: "response.create", event_id: crypto.randomUUID() });
  } finally { if (ownsTask && activeDelegationId === outerId) activeDelegationId = null; if (attempt === connectionAttempt) resetIdle(); }
}
async function executeBackendCall(outerId: string, call: PendingCall): Promise<string> {
  try {
    if (call.name === "run_pi_task") {
      let task = "";
      try { task = String(JSON.parse(call.args || "{}").task ?? ""); } catch { task = ""; }
      const output = await invoke<string | null>("delegate_orchestrator_task", {
        delegationId: outerId, context: toolTaskContext(task), full: true,
      });
      return JSON.stringify(
        output
          ? { status: "completed", result: output }
          : {
              status: "not_completed",
              reason:
                "The Pi task did not finish (it may have been canceled). Tell the user plainly and ask whether to retry instead of assuming progress.",
            },
      );
    }
    if (call.name === "cancel_pi_task") {
      await invoke("cancel_orchestrator_task", { delegationId: outerId });
      return JSON.stringify({ status: "canceled" });
    }
    return JSON.stringify({ status: "error", message: `Unknown tool: ${call.name}` });
  } catch (reason) {
    error(reason);
    return JSON.stringify({
      status: "error",
      message: String(reason),
      recovery:
        "Tell the user plainly what failed and suggest the next step instead of assuming the work is still running.",
    });
  }
}
async function cancelDelegation(event: LiveEvent, attempt: number, newId: string, targetId: string): Promise<void> {
  if (attempt !== connectionAttempt || !newId || event.delegation?.target !== "client" || delegations.has(newId)) { cancellationSent = false; return; }
  if (delegations.size >= 512) delegations.delete(delegations.values().next().value!);
  delegations.add(newId);
  try {
    await invoke("cancel_orchestrator_task", { delegationId: targetId });
  } catch (reason) { error(reason); }
  cancellationSent = false;
  if (attempt === connectionAttempt && channel?.readyState === "open") channel.send(JSON.stringify({
    type: "session.commentary.append", event_id: crypto.randomUUID(), delegation_id: newId,
    content: "The active Pi task was canceled.",
  }));
}
function isCancelRequest(value: string): boolean {
  const text = value.trim().toLowerCase();
  return /^(please\s+)?(cancel|stop)(\s+(that|it|the\s+(current\s+)?task))?[.!?]*$/.test(text)
    || /^(never\s*mind)[.!?]*$/.test(text);
}
function maybeCancel(value: string): void {
  const request = isCancelRequest(value);
  const delegationId = activeDelegationId;
  if (cancellationSent || !request || !delegationId) return;
  cancellationSent = true;
  void invoke("cancel_orchestrator_task", { delegationId }).then(() => {
    if (channel?.readyState === "open") channel.send(JSON.stringify({
      type: "session.commentary.append", event_id: crypto.randomUUID(), delegation_id: delegationId,
      content: "The active Pi task was canceled.",
    }));
  }).catch((reason) => { cancellationSent = false; error(reason); });
}
function isTaskActive(): boolean {
  return activeDelegationId !== null || currentStatus?.taskActive === true;
}
function onIdleTimeout(): void {
  if (!connection) return;
  if (isTaskActive()) {
    clearTimeout(idleTimer);
    idleTimer = window.setTimeout(onIdleTimeout, 60_000);
    return;
  }
  closeSession();
}
function resetIdle(): void {
  clearTimeout(idleTimer); idleTimer = window.setTimeout(onIdleTimeout, 300_000);
}
function closeSession(): void {
  connectionAttempt += 1;
  void invoke("stop_orchestrator_session");
  if (connecting) { closeLocal(); return; }
  if (channel?.readyState === "open") channel.send(JSON.stringify({ type: "session.close" }));
  stopMeter(); microphone?.getTracks().forEach((track) => track.stop());
  if (listening) { listening = false; void invoke("set_orchestrator_listening", { value: false }); }
  clearTimeout(closeTimer); closeTimer = window.setTimeout(closeLocal, 15_000);
}
function disposeAttempt(peer: RTCPeerConnection, stream: MediaStream, events: RTCDataChannel): void {
  stream.getTracks().forEach((track) => track.stop());
  events.removeEventListener("close", closeLocal); events.close(); peer.close();
  if (microphone === stream) microphone = null;
  if (channel === events) channel = null;
  if (connection === peer) connection = null;
}
function closeLocal(notifyBackend: unknown = true): void {
  connectionAttempt += 1; connecting = false; clearTimeout(closeTimer); clearTimeout(idleTimer); closeTimer = 0; idleTimer = 0; stopMeter(); stopMeter = () => {}; microphone?.getTracks().forEach((track) => track.stop());
  microphone = null;
  channel?.removeEventListener("close", closeLocal); channel?.close(); channel = null; connection?.close(); connection = null;
  resetTranscript(); userUtterance = ""; lastUserUtterance = ""; lastInputAt = 0; delegations.clear(); responseCalls.clear(); listening = false; pushToTalk = false; cancellationSent = false; activeDelegationId = null;
  if (notifyBackend !== false) void invoke("stop_orchestrator_session");
}
$("connect").addEventListener("click", () => { if (!connection) void connect(false).catch(error); });
$("connect").addEventListener("pointerdown", () => {
  if (!connection || !pushToTalk || connecting) return;
  resetIdle(); microphone?.getAudioTracks().forEach((track) => { track.enabled = true; });
});
const releaseTalk = () => {
  if (!connection || !pushToTalk) return;
  microphone?.getAudioTracks().forEach((track) => { track.enabled = false; });
  if (listening) { listening = false; void invoke("set_orchestrator_listening", { value: false }); }
};
$("connect").addEventListener("pointerup", releaseTalk);
$("connect").addEventListener("keydown", (event) => {
  if (connection && pushToTalk && !connecting && (event.key === " " || event.key === "Enter")) {
    microphone?.getAudioTracks().forEach((track) => { track.enabled = true; });
  }
});
installReleaseGuards($("connect"), releaseTalk);
$("retry").addEventListener("click", () => void load().catch(error));
$("disconnect").addEventListener("click", closeSession);
$("cancel").addEventListener("click", () => { const delegationId = activeDelegationId; if (!delegationId || cancellationSent) return; cancellationSent = true; void invoke("cancel_orchestrator_task", { delegationId }).catch((reason) => { cancellationSent = false; error(reason); }); });
void listen("orchestrator-status-refresh", () => {
  void invoke<Status>("get_orchestrator_status")
    .then((status) => {
      setStatus(status);
      if (status.available && status.herdrConnected && status.wakeActivated)
        void connect(true, status.wakeGeneration).catch(error);
    })
    .catch(error);
});
void listen<string>("orchestrator-wake-status", (event) => { $("wake-status").textContent = event.payload; });
void listen("orchestrator-disable", closeSession); void listen("orchestrator-exit", () => closeLocal(false)); void listen("orchestrator-reset", closeSession);
window.addEventListener("beforeunload", closeLocal);
void load().catch((reason) => { error(reason); void invoke("stop_orchestrator_session"); });
