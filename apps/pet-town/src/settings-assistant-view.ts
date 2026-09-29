import { ASSISTANT_PET_ID, type PreferencesFile } from "./preferences-types";
import { bundledBehaviorPackForCharacter } from "./character-packs";
import type { OrchestratorStatus } from "./orchestrator-status";

const byId = <T extends HTMLElement>(id: string): T => document.getElementById(id) as T;

export function renderAssistantStatus(
  status: OrchestratorStatus,
  configured: PreferencesFile["app"]["orchestrator"] | null,
): void {
  const ready = byId<HTMLElement>("assistant-ready");
  const live = byId<HTMLElement>("assistant-live-status");
  const herdr = byId<HTMLElement>("assistant-herdr-status");
  const pi = byId<HTMLElement>("assistant-pi-status");
  const petReady = renderPet() && status.petReady;
  if (configured) renderAssistantToggle(configured.enabled, petReady);
  const configuredModel = configured
    ? `${modelLabel(configured.model)} · ${configured.thinking}`
    : "Waiting for settings";
  const runningModel = status.piModel
    ? `${modelLabel(status.piModel)} · ${status.piThinking ?? "unknown"}`
    : configuredModel;
  pi.textContent = configured?.mode === "firstmate"
    ? "Starts in selected Firstmate folder"
    : status.piConnected
    ? `Running · ${runningModel}`
    : configured?.enabled
      ? `Starts after wake phrase · ${configuredModel}`
      : `Disabled · ${configuredModel}`;
  ready.textContent = status.message;
  ready.dataset.ready = String(status.available && status.petReady && status.herdrConnected);
  const voiceIdle =
    configured?.enabled === true &&
    status.available &&
    status.petReady &&
    status.herdrConnected &&
    !status.liveConnected;
  live.textContent = configured?.mode === "firstmate"
    ? status.available ? "STT + TTS ready" : "OpenAI key missing"
    : status.liveConnected
    ? "Connected · tools"
    : status.available
      ? configured?.enabled
        ? status.wakeActivated || status.message === "Connecting voice"
          ? "Connecting voice"
          : configured.wakeEnabled
            ? "Listening for wake phrase"
            : "Voice idle"
        : "Key found"
      : "Key missing";
  live.dataset.ready = String(status.available);
  const reconnect = byId<HTMLButtonElement>("assistant-reconnect");
  const voiceHint = byId<HTMLElement>("assistant-voice-hint");
  if (voiceHint.dataset.mode !== configured?.mode) {
    voiceHint.dataset.mode = configured?.mode ?? "";
    voiceHint.textContent = "";
  }
  reconnect.hidden = !voiceIdle || !configured?.wakeEnabled || status.wakeActivated;
  reconnect.textContent = configured?.mode === "firstmate" ? "Listen for Mayor wake phrase" : "Listen for wake phrase";
  if (status.voiceNote) {
    voiceHint.hidden = false;
    voiceHint.textContent = status.voiceNote;
  } else if (voiceIdle) {
    const name = configured?.displayName.trim() || "Mayor";
    voiceHint.hidden = false;
    if (!voiceHint.textContent || voiceHint.textContent === "Starting voice listener…") {
      voiceHint.textContent = configured?.wakeEnabled
        ? configured?.mode === "firstmate"
          ? `Say “Hey Mayor” or “Hey ${name}” to focus Mayor. Hold to talk in Settings or hold Control+Option in the 3D town.`
          : `Say “Hey Mayor” or “Hey ${name}” to talk using Live mode.`
        : "Wake listening is off.";
    }
  } else {
    reconnect.disabled = false;
    voiceHint.hidden = true;
    voiceHint.textContent = "";
  }
  herdr.textContent = status.herdrConnected ? "Connected" : "Disconnected";
  herdr.dataset.ready = String(status.herdrConnected);
}

export function renderAssistantToggle(enabled: boolean, petReady: boolean): void {
  const toggle = byId<HTMLButtonElement>("assistant-toggle");
  toggle.textContent = enabled ? "Stop mayor" : "Start mayor";
  toggle.classList.toggle("primary", !enabled);
  toggle.classList.toggle("secondary", enabled);
  toggle.disabled = !enabled && !petReady;
}

export function modelLabel(model: string): string {
  return model
    .replace("gpt-", "GPT-")
    .replace("luna", "Luna")
    .replace("sol", "Sol")
    .replace("terra", "Terra");
}
export function renderPet(): boolean {
  const image = byId<HTMLImageElement>("assistant-pet-preview");
  const placeholder = byId("assistant-pet-placeholder");
  try {
    const pack = bundledBehaviorPackForCharacter(ASSISTANT_PET_ID);
    const clip = pack?.orchestratorAnimations?.walking;
    const source = clip ? pack?.clips[clip]?.assetUrl : null;
    if (!source) throw new Error("No assigned preview");
    image.src = source;
    image.hidden = false;
    placeholder.hidden = true;
    return true;
  } catch {
    image.removeAttribute("src");
    image.hidden = true;
    placeholder.hidden = false;
    return false;
  }
}
