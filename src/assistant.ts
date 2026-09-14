import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import type { PreferencesSnapshot } from "./preferences-types";
import { startSpeechMeter } from "./assistant-meter"; import { iceComplete, installReleaseGuards } from "./assistant-webrtc"; import { delegationContext } from "./assistant-context";
type Workspace = { id: string; label: string; project: string };
type Status = { available: boolean; liveConnected: boolean; herdrConnected: boolean; piConnected: boolean; listening: boolean; taskActive: boolean; activeTaskId: string | null; wakeActivated: boolean; wakeGeneration: number; workspaceId: string | null; message: string };
type LiveAnswer = { sessionId: string; sdp: string }; type LiveEvent = { type?: string; delta?: string; transcript?: string; delegation?: { id?: string; target?: string }; error?: { message?: string } };
const $ = <T extends HTMLElement>(id: string): T => document.getElementById(id) as T;
let connection: RTCPeerConnection | null = null, channel: RTCDataChannel | null = null;
let microphone: MediaStream | null = null, stopMeter = () => {};
let connecting = false, listening = false, pushToTalk = false, cancellationSent = false;
let closeTimer = 0, idleTimer = 0, connectionAttempt = 0;
let activeDelegationId: string | null = null; let currentStatus: Status | null = null;
let transcript = "", transcriptRole = "", userUtterance = "";
let delegationQueue = Promise.resolve(); const delegations = new Set<string>();
function setStatus(status: Status): void {
  currentStatus = status; activeDelegationId = status.activeTaskId; $("connection").textContent = status.message;
  $("connection").dataset.live = String(status.liveConnected);
  $("voice-state").textContent = status.liveConnected ? (status.listening ? "Listening" : "Walking") : status.message;
  const talk = $<HTMLButtonElement>("connect");
  talk.disabled = connecting || !status.available || !status.herdrConnected;
  talk.textContent = status.liveConnected ? (pushToTalk ? "Hold to talk" : "Listening") : "Connect voice";
  $<HTMLButtonElement>("disconnect").disabled = !status.liveConnected && !connecting;
  $<HTMLButtonElement>("cancel").disabled = !status.taskActive;
  $<HTMLSelectElement>("workspace").disabled = status.liveConnected;
}
function error(value: unknown): void { $("error").textContent = String(value); }
async function load(): Promise<void> {
  await invoke("show_orchestrator");
  const [preferences, workspaces, status] = await Promise.all([
    invoke<PreferencesSnapshot>("get_preferences"), invoke<Workspace[]>("list_orchestrator_workspaces"),
    invoke<Status>("get_orchestrator_status"),
  ]);
  $("assistant-title").textContent = preferences.preferences.app.orchestrator.displayName;
  const workspace = $<HTMLSelectElement>("workspace");
  workspace.replaceChildren(...workspaces.map((item) => new Option(`${item.label} · ${item.project}`, item.id)));
  if (!workspaces.length) workspace.append(new Option("No Herdr workspace available", ""));
  if (status.workspaceId && workspaces.some((item) => item.id === status.workspaceId)) workspace.value = status.workspaceId;
  setStatus(status);
  if (status.available && status.herdrConnected && status.wakeActivated) await connect(true, status.wakeGeneration);
}
async function connect(fromWake = false, wakeGeneration?: number): Promise<void> {
  if (connecting || connection) return;
  connecting = true; const attempt = ++connectionAttempt; error("");
  $<HTMLButtonElement>("connect").disabled = true; $<HTMLButtonElement>("disconnect").disabled = false;
  try {
  const workspaceId = $<HTMLSelectElement>("workspace").value;
  if (!workspaceId) throw new Error("Choose a running Herdr workspace first.");
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
  });
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
  const answer = await invoke<LiveAnswer>("start_orchestrator_session", {
    workspaceId, sdp: peer.localDescription?.sdp ?? "", wakeGeneration: wakeGeneration ?? null,
  });
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
    resetIdle(); userUtterance += event.delta; appendTranscript("user", event.delta);
  }
  if (event.type === "session.input_transcript.done") {
    const utterance = event.transcript ?? userUtterance; userUtterance = ""; maybeCancel(utterance); }
  if (event.type === "session.output_transcript.delta" && event.delta) {
    cancellationSent = false; appendTranscript("assistant", event.delta);
  }
  if (event.type === "session.delegation.created") {
    const attempt = connectionAttempt, context = delegationContext(transcript);
    delegationQueue = delegationQueue.then(() => delegate(event, attempt, context));
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
    const output = await invoke<string | null>("delegate_orchestrator_task", { delegationId: id, context });
    if (attempt === connectionAttempt && output && channel?.readyState === "open") channel.send(JSON.stringify({
      type: "session.commentary.append", event_id: crypto.randomUUID(), delegation_id: id, content: output,
    }));
  } catch (reason) {
    if (attempt !== connectionAttempt) return; error(reason);
    if (channel?.readyState === "open") channel.send(JSON.stringify({
      type: "session.commentary.append", event_id: crypto.randomUUID(), delegation_id: id,
      content: "The Pi agent could not complete that request. Please try again or choose another workspace.",
    }));
  } finally { if (ownsTask && activeDelegationId === id) activeDelegationId = null; }
}
function maybeCancel(value: string): void {
  const text = value.trim().toLowerCase();
  const request = /^(please\s+)?(cancel|stop)(\s+(that|it|the\s+(current\s+)?task))?[.!?]*$/.test(text)
    || /^(never\s*mind)[.!?]*$/.test(text);
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
function appendTranscript(role: "user" | "assistant", delta: string): void {
  transcript = `${transcript}${transcriptRole === role ? "" : `\n${role}: `}${delta}`.slice(-22_000);
  transcriptRole = role;
  const container = $("transcript"); container.querySelector(".empty")?.remove();
  let paragraph = container.lastElementChild as HTMLElement | null;
  if (!paragraph?.classList.contains(role)) {
    paragraph = document.createElement("p"); paragraph.className = role; container.append(paragraph);
  }
  paragraph.textContent = `${paragraph.textContent ?? ""}${delta}`.slice(-12_000);
  while (container.childElementCount > 80) container.firstElementChild?.remove();
  container.scrollTop = container.scrollHeight;
}
function resetIdle(): void {
  clearTimeout(idleTimer); idleTimer = window.setTimeout(() => { if (connection) closeSession(); }, 300_000);
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
  transcript = ""; transcriptRole = ""; userUtterance = ""; delegations.clear(); listening = false; pushToTalk = false; cancellationSent = false; activeDelegationId = null;
  $("transcript").replaceChildren(Object.assign(document.createElement("p"), { className: "empty", textContent: "Conversation text appears here temporarily." }));
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
void listen<Status>("orchestrator-status", (event) => {
  setStatus(event.payload);
  if (event.payload.available && event.payload.herdrConnected && event.payload.wakeActivated) void connect(true, event.payload.wakeGeneration).catch(error);
});
void listen<string>("orchestrator-wake-status", (event) => { $("wake-status").textContent = event.payload; });
void listen("orchestrator-disable", closeSession); void listen("orchestrator-exit", () => closeLocal(false)); void listen("orchestrator-reset", closeSession);
window.addEventListener("beforeunload", closeLocal);
void load().catch((reason) => { error(reason); void invoke("stop_orchestrator_session"); });
