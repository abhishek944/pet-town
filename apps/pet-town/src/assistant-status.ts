import type { OrchestratorStatus as Status } from "./orchestrator-status";

const $ = <T extends HTMLElement>(id: string): T => document.getElementById(id) as T;

export function renderVoiceStatus(status: Status, connecting: boolean, pushToTalk: boolean): void {
  $("connection").textContent = status.message;
  $("connection").dataset.live = String(status.liveConnected);
  $("voice-state").textContent = status.liveConnected
    ? status.listening
      ? "Listening"
      : "Walking"
    : status.message;
  const talk = $<HTMLButtonElement>("connect");
  talk.disabled = connecting || !status.available || !status.petReady || !status.herdrConnected;
  talk.textContent = status.liveConnected
    ? pushToTalk
      ? "Hold to talk"
      : "Listening"
    : "Connect voice";
  $<HTMLButtonElement>("disconnect").disabled = !status.liveConnected && !connecting;
  $<HTMLButtonElement>("cancel").disabled = !status.taskActive;
  $<HTMLSelectElement>("workspace").disabled = status.liveConnected;
}

export function isMayorWake(utterance: string, mayorName: string): boolean {
  const normalized = utterance
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
  const names = [
    "mayor",
    mayorName
      .toLocaleLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, " ")
      .trim(),
  ];
  return names.some((name) => name && ` ${normalized} `.includes(` hey ${name} `));
}
