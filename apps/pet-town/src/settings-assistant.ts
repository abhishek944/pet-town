import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import type { PreferencesFile } from "./preferences-types";
import {
  modelLabel,
  renderAssistantStatus,
  renderAssistantToggle,
  renderPet,
} from "./settings-assistant-view";
import { bindAssistantControls } from "./settings-assistant/controls";
import type { OrchestratorStatus } from "./orchestrator-status";
import { AssistantKeySettings } from "./settings-assistant-key";

const byId = <T extends HTMLElement>(id: string): T => document.getElementById(id) as T;

export class AssistantSettings {
  private voiceReady = false;
  private mayorPhase = "ready";
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
    voiceNote: null,
    message: "Not connected",
  };

  constructor(
    private readonly draft: () => PreferencesFile,
    private readonly changed: () => void,
    private readonly applied: () => PreferencesFile["app"]["orchestrator"] | null,
  ) {
    bindAssistantControls(this.draft, this.changed, () => this.render());
    new AssistantKeySettings();
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
    byId<HTMLSelectElement>("assistant-mode").value = value.mode;
    const firstmate = value.mode === "firstmate";
    byId<HTMLElement>("assistant-standard-controls").hidden = !firstmate;
    byId<HTMLElement>("assistant-live-conversation").hidden = firstmate;
    byId<HTMLElement>("assistant-live-prompt").hidden = firstmate;
    byId<HTMLElement>("assistant-model-hint").textContent = firstmate
      ? "This model runs the Firstmate primary agent in your selected checkout."
      : "Live mode uses GPT-Live for speech and this model for Firstmate's work.";
    byId<HTMLElement>("assistant-connection-hint").textContent = firstmate
      ? "Wake or Option+M focuses Mayor. Hold to talk in Settings or hold Control+Option in the 3D town."
      : "Wake or Option+M starts GPT-Live, with computer work sent to Firstmate.";
    byId<HTMLButtonElement>("assistant-talk").disabled = !this.talkAvailable(value);
    byId<HTMLButtonElement>("assistant-talk").textContent = this.talkLabel(
      firstmate && value.enabled,
    );
    const firstmateFolder = byId<HTMLElement>("assistant-firstmate-folder");
    firstmateFolder.textContent = value.firstmatePath?.split("/").pop() || "Not selected";
    firstmateFolder.title = value.firstmatePath || "Choose a Firstmate checkout";
    const promptBox = byId<HTMLTextAreaElement>("assistant-system-prompt");
    if (promptBox.value !== value.systemPrompt) promptBox.value = value.systemPrompt;
    const name = value.displayName.trim() || "Mayor";
    byId<HTMLElement>("assistant-intro").textContent = `Hi, I’m ${name}.`;
    byId<HTMLElement>("assistant-wake-phrase").textContent = value.enabled
      ? `Say “Hey Mayor” or “Hey ${name}” to call your mayor.${value.mode === "firstmate" ? " Then hold to talk." : ""}`
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

  private async refreshStatus(): Promise<void> {
    try {
      this.status = await invoke<OrchestratorStatus>("get_orchestrator_status");
      this.voiceReady = await invoke<boolean>("firstmate_voice_ready");
      this.mayorPhase = await invoke<string>("firstmate_phase");
    } catch (error) {
      this.voiceReady = false;
      this.mayorPhase = "ready";
      this.status = { ...this.status, message: String(error) };
    }
    this.renderStatus();
  }

  private renderStatus(): void {
    const configuration = this.currentConfiguration();
    renderAssistantStatus(this.status, configuration);
    byId<HTMLButtonElement>("assistant-talk").disabled = !this.talkAvailable(configuration);
    byId<HTMLButtonElement>("assistant-talk").textContent = this.talkLabel(
      configuration?.mode === "firstmate" && !!configuration.enabled,
    );
  }

  private talkLabel(firstmate: boolean): string {
    if (firstmate && !this.voiceReady) return "Mayor starting…";
    if (this.mayorPhase === "working") return "Mayor working…";
    if (this.mayorPhase === "speaking") return "Mayor speaking…";
    return "Hold to talk";
  }

  private talkAvailable(value: PreferencesFile["app"]["orchestrator"] | null): boolean {
    const saved = this.applied();
    return (
      !!value?.enabled &&
      value.mode === "firstmate" &&
      !!value.firstmatePath &&
      value.firstmatePath === value.trustedFirstmatePath &&
      this.status.available &&
      this.voiceReady &&
      this.mayorPhase !== "working" &&
      this.mayorPhase !== "speaking" &&
      !!saved?.enabled &&
      saved.mode === value.mode &&
      saved.firstmatePath === value.firstmatePath &&
      saved.trustedFirstmatePath === value.trustedFirstmatePath &&
      saved.model === value.model &&
      saved.thinking === value.thinking
    );
  }

  private currentConfiguration(): PreferencesFile["app"]["orchestrator"] | null {
    try {
      return this.draft()?.app?.orchestrator ?? null;
    } catch {
      return null;
    }
  }
}
