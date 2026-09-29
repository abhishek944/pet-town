import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import type { PreferencesSnapshot } from "./preferences-types";
import type { OrchestratorStatus as Status } from "./orchestrator-status";
import { startSpeechMeter } from "./assistant-meter"; import { iceComplete, installReleaseGuards } from "./assistant-webrtc"; import { AssistantTasks, type LiveEvent } from "./assistant-tasks";
import { renderVoiceStatus } from "./assistant-status";
import { LiveTranscripts } from "./assistant-live-transcripts";
import { FirstmateVoice } from "./assistant-firstmate";
type LiveAnswer = { sessionId: string; sdp: string }; const $ = <T extends HTMLElement>(id: string): T => document.getElementById(id) as T;
let connection: RTCPeerConnection | null = null, channel: RTCDataChannel | null = null;
let microphone: MediaStream | null = null, stopMeter = () => {};
let connecting = false, listening = false, pushToTalk = false;
let closeTimer = 0, idleTimer = 0, connectionAttempt = 0;
let currentStatus: Status | null = null;
let firstmate: FirstmateVoice | null = null;
let firstmateMode = false;
const tasks = new AssistantTasks({ attempt: () => connectionAttempt, channel: () => channel, error, resetIdle });
const transcripts = new LiveTranscripts();
function setStatus(status: Status): void {
  currentStatus = status; tasks.activeDelegationId = status.activeTaskId;
  if (!firstmateMode) renderVoiceStatus(status, connecting, pushToTalk);
}
function error(value: unknown): void {
  const message = String(value);
  $("error").textContent = message;
  if (message) void invoke(firstmateMode ? "report_orchestrator_diagnostic" : "report_orchestrator_error", { message });
}
async function load(): Promise<void> {
  const [preferences, status] = await Promise.all([
    invoke<PreferencesSnapshot>("get_preferences"), invoke<Status>("get_orchestrator_status"),
  ]);
  $("assistant-title").textContent = preferences.preferences.app.orchestrator.displayName;
  firstmateMode = preferences.preferences.app.orchestrator.mode === "firstmate";
  if (firstmateMode) {
    $("retry").textContent = "Retry voice";
    $("voice-state").nextElementSibling!.textContent = "Hold to talk. Your speech is transcribed and sent to Firstmate; replies use an AI-generated voice.";
  }
  transcripts.setMayorName(preferences.preferences.app.orchestrator.displayName);
  setStatus(status);
  if (firstmateMode) {
    firstmate = new FirstmateVoice(error);
    await firstmate.activate();
  } else if (status.available && status.herdrConnected && status.wakeActivated)
    await connect(true, status.wakeGeneration);
}
async function connect(fromWake = false, wakeGeneration?: number): Promise<void> {
  if (firstmateMode) return;
  if (closeTimer) {
    clearTimeout(closeTimer); closeTimer = 0;
    closeLocal(false);
  }
  if (connecting || connection) return;
  connecting = true; const attempt = ++connectionAttempt; error("");
  $<HTMLButtonElement>("connect").disabled = true; $<HTMLButtonElement>("disconnect").disabled = false;
  try {
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
  await invoke("report_orchestrator_diagnostic", { message: "starting Firstmate and GPT-Live" });
  const answer = await invoke<LiveAnswer>("start_orchestrator_session", {
    workspaceId: "", sdp: peer.localDescription?.sdp ?? "", wakeGeneration: wakeGeneration ?? null,
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
  transcripts.handle(event, resetIdle, (utterance) => tasks.maybeCancel(utterance));
  if (event.type === "session.output_transcript.delta" && event.delta) {
    tasks.cancellationSent = false;
    tasks.noteSpeech();
  }
  if (event.type === "response.event") {
    resetIdle();
    tasks.handleResponseEvent(event, connectionAttempt);
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
  if (firstmateMode) return;
  connectionAttempt += 1;
  void invoke("stop_orchestrator_session");
  if (connecting) { closeLocal(false); return; }
  if (channel?.readyState === "open") channel.send(JSON.stringify({ type: "session.close" }));
  stopMeter(); microphone?.getTracks().forEach((track) => track.stop());
  if (listening) { listening = false; void invoke("set_orchestrator_listening", { value: false }); }
  clearTimeout(closeTimer); closeTimer = window.setTimeout(() => closeLocal(false), 15_000);
}
function disposeAttempt(peer: RTCPeerConnection, stream: MediaStream, events: RTCDataChannel): void {
  stream.getTracks().forEach((track) => track.stop());
  events.removeEventListener("close", closeLocal); events.close(); peer.close();
  if (microphone === stream) microphone = null;
  if (channel === events) channel = null;
  if (connection === peer) connection = null;
}
function closeLocal(notifyBackend: unknown = true): void {
  const shouldNotifyBackend = notifyBackend !== false && closeTimer === 0;
  connectionAttempt += 1; connecting = false; clearTimeout(closeTimer); clearTimeout(idleTimer); closeTimer = 0; idleTimer = 0; stopMeter(); stopMeter = () => {}; microphone?.getTracks().forEach((track) => track.stop());
  microphone = null;
  channel?.removeEventListener("close", closeLocal); channel?.close(); channel = null; connection?.close(); connection = null;
  transcripts.clear(); tasks.clear(); listening = false; pushToTalk = false;
  if (shouldNotifyBackend && !firstmateMode) void invoke("stop_orchestrator_session");
}
$("connect").addEventListener("click", () => { if (!firstmateMode && !connection) void connect(false).catch(error); });
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
$("retry").addEventListener("click", () => {
  if (firstmateMode) void firstmate?.retryVoice();
  else void load().catch(error);
});
$("disconnect").addEventListener("click", closeSession);
$("cancel").addEventListener("click", () => tasks.cancelActive());
void listen("orchestrator-status-refresh", () => {
  void invoke<Status>("get_orchestrator_status")
    .then((status) => {
      setStatus(status);
      if (firstmateMode) return;
      if (status.available && status.herdrConnected && status.wakeActivated)
        void connect(true, status.wakeGeneration).catch(error);
    })
    .catch(error);
});
void listen<string>("orchestrator-wake-status", (event) => { $("wake-status").textContent = event.payload; });
void listen("orchestrator-mayor-invoked", () => {
  if (!connection || connecting) return;
  pushToTalk = false;
  microphone?.getAudioTracks().forEach((track) => { track.enabled = true; });
  $<HTMLButtonElement>("connect").textContent = "Listening";
  resetIdle();
});
void listen("orchestrator-disable", () => { firstmate?.stop(); closeLocal(false); }); void listen("orchestrator-exit", () => { firstmate?.stop(); closeLocal(false); }); void listen("orchestrator-reset", () => { firstmate?.stop(); closeLocal(false); });
window.addEventListener("beforeunload", () => { firstmate?.stop(); closeLocal(false); });
void load().catch((reason) => { error(reason); if (!firstmateMode) void invoke("stop_orchestrator_session"); });
