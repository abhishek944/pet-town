import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { ASSISTANT_PET_ID, type PreferencesFile } from "./preferences-types";
import { bundledBehaviorPackForCharacter } from "./character-packs";
import type { OrchestratorStatus } from "./orchestrator-status";

const byId = <T extends HTMLElement>(id: string): T => document.getElementById(id) as T;

export class AssistantSettings {
  private status: OrchestratorStatus = {
    available: false,
    petReady: false,
    liveConnected: false,
    herdrConnected: false,
    piConnected: false,
    piModel: null,
    piThinking: null,
    listening: false,
    taskActive: false,
    activeTaskId: null,
    wakeActivated: false,
    wakeGeneration: 0,
    workspaceId: null,
    message: "Not connected",
  };

  constructor(
    private readonly draft: () => PreferencesFile,
    private readonly changed: () => void,
  ) {
    this.bind();
    void this.refreshStatus();
    void listen("orchestrator-status-refresh", () => void this.refreshStatus());
    void listen<string>("orchestrator-wake-status", (event) => {
      this.status = { ...this.status, message: event.payload };
      this.renderStatus();
    });
  }

  render(): void {
    const value = this.draft().app.orchestrator;
    byId<HTMLInputElement>("assistant-name").value = value.displayName;
    byId<HTMLSelectElement>("assistant-model").value = value.model;
    byId<HTMLSelectElement>("assistant-thinking").value = value.thinking;
    const name = value.displayName.trim() || "your assistant";
    byId<HTMLElement>("assistant-intro").textContent = `Hi, I’m ${name}.`;
    byId<HTMLElement>("assistant-wake-phrase").textContent = value.enabled
      ? `Say “Hey, ${name}” to start talking.`
      : `Start the assistant, then say “Hey, ${name}” to start talking.`;
    const petReady = renderPet() && this.status.petReady;
    const model = `${this.modelLabel(value.model)} · ${value.thinking}`;
    byId<HTMLElement>("assistant-pi-status").textContent = this.status.piConnected
      ? `Running · ${model}`
      : value.enabled
        ? `Starts after wake phrase · ${model}`
        : `Disabled · ${model}`;
    this.renderToggle(value.enabled, petReady);
    this.renderStatus();
  }

  private bind(): void {
    byId<HTMLInputElement>("assistant-name").addEventListener("input", (event) => {
      this.draft().app.orchestrator.displayName = (event.currentTarget as HTMLInputElement).value;
      this.changed();
    });
    byId<HTMLSelectElement>("assistant-model").addEventListener("change", (event) => {
      this.draft().app.orchestrator.model = (event.currentTarget as HTMLSelectElement)
        .value as PreferencesFile["app"]["orchestrator"]["model"];
      this.changed();
    });
    byId<HTMLSelectElement>("assistant-thinking").addEventListener("change", (event) => {
      this.draft().app.orchestrator.thinking = (event.currentTarget as HTMLSelectElement)
        .value as PreferencesFile["app"]["orchestrator"]["thinking"];
      this.changed();
    });
    byId<HTMLButtonElement>("assistant-toggle").addEventListener("click", () => {
      this.draft().app.orchestrator.enabled = !this.draft().app.orchestrator.enabled;
      this.changed();
      byId<HTMLButtonElement>("apply").click();
    });
  }

  private async refreshStatus(): Promise<void> {
    try {
      this.status = await invoke<OrchestratorStatus>("get_orchestrator_status");
    } catch (error) {
      this.status = { ...this.status, message: String(error) };
    }
    this.renderStatus();
  }

  private renderStatus(): void {
    const ready = byId<HTMLElement>("assistant-ready");
    const live = byId<HTMLElement>("assistant-live-status");
    const herdr = byId<HTMLElement>("assistant-herdr-status");
    const pi = byId<HTMLElement>("assistant-pi-status");
    const configured = this.currentConfiguration();
    const petReady = renderPet() && this.status.petReady;
    if (configured) this.renderToggle(configured.enabled, petReady);
    const configuredModel = configured
      ? `${this.modelLabel(configured.model)} · ${configured.thinking}`
      : "Waiting for settings";
    const runningModel = this.status.piModel
      ? `${this.modelLabel(this.status.piModel)} · ${this.status.piThinking ?? "unknown"}`
      : configuredModel;
    pi.textContent = this.status.piConnected
      ? `Running · ${runningModel}`
      : configured?.enabled
        ? `Starts after wake phrase · ${configuredModel}`
        : `Disabled · ${configuredModel}`;
    ready.textContent = this.status.message;
    ready.dataset.ready = String(
      this.status.available && this.status.petReady && this.status.herdrConnected,
    );
    live.textContent = this.status.liveConnected
      ? "Connected"
      : this.status.available
        ? "Key found"
        : "Key missing";
    live.dataset.ready = String(this.status.available);
    herdr.textContent = this.status.herdrConnected ? "Connected" : "Disconnected";
    herdr.dataset.ready = String(this.status.herdrConnected);
  }

  private renderToggle(enabled: boolean, petReady: boolean): void {
    const toggle = byId<HTMLButtonElement>("assistant-toggle");
    toggle.textContent = enabled ? "Stop assistant" : "Start assistant";
    toggle.classList.toggle("primary", !enabled);
    toggle.classList.toggle("secondary", enabled);
    toggle.disabled = !enabled && !petReady;
  }

  private currentConfiguration(): PreferencesFile["app"]["orchestrator"] | null {
    try {
      return this.draft()?.app?.orchestrator ?? null;
    } catch {
      return null;
    }
  }

  private modelLabel(model: string): string {
    return model
      .replace("gpt-", "GPT-")
      .replace("luna", "Luna")
      .replace("sol", "Sol")
      .replace("terra", "Terra");
  }
}

function renderPet(): boolean {
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
