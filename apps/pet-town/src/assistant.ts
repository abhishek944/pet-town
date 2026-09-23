import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import type { PreferencesSnapshot } from "./preferences-types";
import type { OrchestratorStatus as Status } from "./orchestrator-status";
import { startSpeechMeter } from "./assistant-meter"; import { iceComplete, installReleaseGuards } from "./assistant-webrtc"; import { AssistantTasks, type LiveEvent } from "./assistant-tasks";
import { isMayorWake, renderVoiceStatus } from "./assistant-status"; import { appendTranscript, resetTranscript } from "./assistant-transcript";
type Workspace = { id: string; label: string; project: string };
type LiveAnswer = { sessionId: string; sdp: string }; const $ = <T extends HTMLElement>(id: string): T => document.getElementById(id) as T;
let connection: RTCPeerConnection | null = null, channel: RTCDataChannel | null = null;
let microphone: MediaStream | null = null, stopMeter = () => {};
let connecting = false, listening = false, pushToTalk = false;
let closeTimer = 0, idleTimer = 0, connectionAttempt = 0;
let currentStatus: Status | null = null;
const tasks = new AssistantTasks({ attempt: () => connectionAttempt, channel: () => channel, status: () => currentStatus, error, resetIdle });
let userUtterance = "";
let lastUserUtterance = "";
let lastInputAt = 0;
let mayorName = "Mayor";
function setStatus(status: Status): void {
  currentStatus = status; tasks.activeDelegationId = status.activeTaskId;
  renderVoiceStatus(status, connecting, pushToTalk);
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
  mayorName = preferences.preferences.app.orchestrator.displayName;
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
    if (isMayorWake(utterance, mayorName)) void invoke("focus_mayor");
    if (utterance) lastUserUtterance = utterance;
    tasks.maybeCancel(utterance); }
  if (event.type === "session.output_transcript.delta" && event.delta) {
    resetIdle(); tasks.cancellationSent = false;
    if (Date.now() - lastInputAt > 2500) userUtterance = "";
    appendTranscript("assistant", event.delta);
  }
  if (event.type === "response.event") {
    resetIdle();
    tasks.handleResponseEvent(event, connectionAttempt);
  }
  if (event.type === "session.delegation.created") {
    resetIdle();
    const task = userUtterance.trim() || lastUserUtterance;
    userUtterance = "";
    if (task.trim()) lastUserUtterance = task.trim();
    tasks.handleDelegation(event, task);
  }
  if (event.type === "session.closed") closeLocal();
  if (event.type === "error") error(event.error?.message ?? "GPT-Live reported an error.");
}
function onIdleTimeout(): void {
  if (!connection) return;
  if (tasks.activeDelegationId !== null || currentStatus?.taskActive === true) {
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
  resetTranscript(); userUtterance = ""; lastUserUtterance = ""; lastInputAt = 0; tasks.clear(); listening = false; pushToTalk = false;
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
$("cancel").addEventListener("click", () => tasks.cancelActive());
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
