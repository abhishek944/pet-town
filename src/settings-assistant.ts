import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import type { PreferencesFile } from "./preferences-types";
import { behaviorPackForCharacter } from "./character-packs";

interface OrchestratorStatus {
  available: boolean;
  liveConnected: boolean;
  herdrConnected: boolean;
  piConnected: boolean;
  message: string;
}

const byId = <T extends HTMLElement>(id: string): T =>
  document.getElementById(id) as T;

export class AssistantSettings {
  private status: OrchestratorStatus = {
    available: false,
    liveConnected: false,
    herdrConnected: false,
    piConnected: false,
    message: "Not connected",
  };

  constructor(
    private readonly draft: () => PreferencesFile,
    private readonly changed: () => void,
  ) {
    this.bind();
    void this.refreshStatus();
    void listen<OrchestratorStatus>("orchestrator-status", (event) => {
      this.status = event.payload;
      this.renderStatus();
    });
    void listen<string>("orchestrator-wake-status", (event) => {
      this.status = { ...this.status, message: event.payload }; this.renderStatus();
    });
  }

  render(): void {
    const value = this.draft().app.orchestrator;
    byId<HTMLInputElement>("assistant-name").value = value.displayName;
    byId<HTMLSelectElement>("assistant-model").value = value.model;
    byId<HTMLSelectElement>("assistant-thinking").value = value.thinking;
    byId<HTMLButtonElement>("assistant-wake-enabled")
      .setAttribute("aria-checked", String(value.wakeEnabled));
    byId<HTMLElement>("assistant-wake-phrase").textContent =
      `Wake it by saying “Hey, ${value.displayName.trim() || "your chosen name"}.”`;
    byId<HTMLElement>("assistant-intro").textContent =
      `Hi, I’m ${value.displayName.trim() || "your orchestrator"}.`;
    renderPet(value.petId);
    byId<HTMLElement>("assistant-pi-status").textContent =
      `${this.modelLabel(value.model)} · ${value.thinking}`;
    byId<HTMLButtonElement>("assistant-disable").disabled = !value.enabled;
    byId<HTMLButtonElement>("assistant-open").disabled = !value.enabled;
    this.renderStatus();
  }

  private bind(): void {
    byId<HTMLInputElement>("assistant-name").addEventListener("input", (event) => {
      this.draft().app.orchestrator.displayName =
        (event.currentTarget as HTMLInputElement).value;
      this.changed();
    });
    byId<HTMLSelectElement>("assistant-model").addEventListener("change", (event) => {
      this.draft().app.orchestrator.model =
        (event.currentTarget as HTMLSelectElement).value as PreferencesFile["app"]["orchestrator"]["model"];
      this.changed();
    });
    byId<HTMLSelectElement>("assistant-thinking").addEventListener("change", (event) => {
      this.draft().app.orchestrator.thinking =
        (event.currentTarget as HTMLSelectElement).value as PreferencesFile["app"]["orchestrator"]["thinking"];
      this.changed();
    });
    byId<HTMLButtonElement>("assistant-wake-enabled").addEventListener("click", () => {
      const value = this.draft().app.orchestrator;
      value.wakeEnabled = !value.wakeEnabled;
      this.changed();
    });
    byId<HTMLButtonElement>("assistant-disable").addEventListener("click", () => {
      this.draft().app.orchestrator.enabled = false;
      this.changed();
      byId<HTMLButtonElement>("apply").click();
    });
    byId<HTMLButtonElement>("assistant-save").addEventListener("click", () => {
      this.draft().app.orchestrator.enabled = true;
      this.changed();
      byId<HTMLButtonElement>("apply").click();
    });
    byId<HTMLButtonElement>("assistant-open").addEventListener("click", () => {
      void invoke("open_orchestrator").then(() => this.refreshStatus());
    });
    byId<HTMLButtonElement>("assistant-test-wake").addEventListener("click", () => {
      const name = this.draft().app.orchestrator.displayName;
      void invoke("test_wake_phrase", { name }).catch((error) => {
        this.status = { ...this.status, message: String(error) }; this.renderStatus();
      });
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
    ready.textContent = this.status.message;
    ready.dataset.ready = String(this.status.available && this.status.herdrConnected);
    live.textContent = this.status.liveConnected ? "Connected" : this.status.available ? "Available" : "Key missing";
    live.dataset.ready = String(this.status.available);
    herdr.textContent = this.status.herdrConnected ? "Connected" : "Disconnected";
    herdr.dataset.ready = String(this.status.herdrConnected);
  }

  private modelLabel(model: string): string {
    return model.replace("gpt-", "GPT-").replace("luna", "Luna")
      .replace("sol", "Sol").replace("terra", "Terra");
  }
}

function renderPet(petId: string | null): void {
  const image = byId<HTMLImageElement>("assistant-pet-preview");
  const placeholder = byId("assistant-pet-placeholder");
  try {
    const pack = petId ? behaviorPackForCharacter(petId) : null;
    const clip = pack?.orchestratorAnimations?.walking;
    const source = clip ? pack?.clips[clip]?.assetUrl : null;
    if (!source) throw new Error("No assigned preview");
    image.src = source; image.hidden = false; placeholder.hidden = true;
  } catch {
    image.removeAttribute("src"); image.hidden = true; placeholder.hidden = false;
  }
}
