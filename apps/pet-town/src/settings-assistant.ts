import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import type { PreferencesFile } from "./preferences-types";
import {
  modelLabel,
  renderAssistantStatus,
  renderAssistantToggle,
  renderPet,
} from "./settings-assistant-view";
import { open } from "@tauri-apps/plugin-dialog";
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
    voiceMode: "idle",
    voiceNote: null,
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
    const promptBox = byId<HTMLTextAreaElement>("assistant-system-prompt");
    if (promptBox.value !== value.systemPrompt) promptBox.value = value.systemPrompt;
    this.renderFolder();
    const name = value.displayName.trim() || "Mayor";
    byId<HTMLElement>("assistant-intro").textContent = `Hi, I’m ${name}.`;
    byId<HTMLElement>("assistant-wake-phrase").textContent = value.enabled
      ? `Say “Hey Mayor” or “Hey ${name}” to call your mayor.`
      : `Start the mayor, then say “Hey Mayor” or “Hey ${name}”.`;
    const petReady = renderPet() && this.status.petReady;
    const model = `${modelLabel(value.model)} · ${value.thinking}`;
    byId<HTMLElement>("assistant-pi-status").textContent = this.status.piConnected
      ? `Running · ${model}`
      : value.enabled
        ? `Starts after wake phrase · ${model}`
        : `Disabled · ${model}`;
    renderAssistantToggle(value.enabled, petReady);
    this.renderStatus();
  }

  private renderFolder(): void {
    const saved = this.currentConfiguration()?.workspaceId ?? null;
    const label = byId<HTMLElement>("assistant-folder");
    if (saved && saved.startsWith("/")) {
      label.textContent = saved.split("/").pop() || saved;
      label.title = saved;
    } else {
      label.textContent = "Documents";
      label.title = "Your Documents folder";
    }
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
    byId<HTMLTextAreaElement>("assistant-system-prompt").addEventListener("input", (event) => {
      this.draft().app.orchestrator.systemPrompt = (
        event.currentTarget as HTMLTextAreaElement
      ).value;
      this.changed();
    });
    byId<HTMLButtonElement>("assistant-pick-folder").addEventListener("click", () => {
      const button = byId<HTMLButtonElement>("assistant-pick-folder");
      button.disabled = true;
      open({ directory: true, multiple: false, title: "Choose Pi session folder" }).then(
        (picked) => {
          button.disabled = false;
          if (typeof picked === "string" && picked) {
            this.draft().app.orchestrator.workspaceId = picked;
            this.changed();
            this.renderFolder();
          }
        },
        () => {
          button.disabled = false;
        },
      );
    });
    byId<HTMLButtonElement>("assistant-toggle").addEventListener("click", () => {
      this.draft().app.orchestrator.enabled = !this.draft().app.orchestrator.enabled;
      this.changed();
      byId<HTMLButtonElement>("apply").click();
    });
    byId<HTMLButtonElement>("assistant-reconnect").addEventListener("click", () => {
      const button = byId<HTMLButtonElement>("assistant-reconnect");
      const hint = byId<HTMLElement>("assistant-voice-hint");
      button.disabled = true;
      hint.hidden = false;
      hint.textContent = "Starting voice listener…";
      invoke<string>("rearm_orchestrator_voice").then(
        (message) => {
          hint.textContent = message;
          button.disabled = false;
        },
        (error) => {
          hint.textContent = String(error ?? "Could not restart the voice listener.");
          button.disabled = false;
        },
      );
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
    renderAssistantStatus(this.status, this.currentConfiguration());
  }

  private currentConfiguration(): PreferencesFile["app"]["orchestrator"] | null {
    try {
      return this.draft()?.app?.orchestrator ?? null;
    } catch {
      return null;
    }
  }
}
