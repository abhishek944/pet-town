import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import type { PreferencesFile } from "../preferences-types";

const byId = <T extends HTMLElement>(id: string): T => document.getElementById(id) as T;

export function bindAssistantControls(
  draft: () => PreferencesFile,
  changed: () => void,
  render: () => void,
): void {
  const talk = byId<HTMLButtonElement>("assistant-talk");
  const releaseTalk = () => {
    void invoke("set_firstmate_talk", { active: false }).catch(() => {});
  };
  talk.addEventListener("pointerdown", (event) => {
    if (talk.disabled) return;
    event.preventDefault();
    talk.setPointerCapture(event.pointerId);
    void invoke("set_firstmate_talk", { active: true }).catch((reason) => {
      byId<HTMLElement>("assistant-voice-hint").hidden = false;
      byId<HTMLElement>("assistant-voice-hint").textContent = String(reason);
    });
  });
  talk.addEventListener("pointerup", releaseTalk);
  talk.addEventListener("pointercancel", releaseTalk);
  talk.addEventListener("keydown", (event) => {
    if ((event.key === " " || event.key === "Enter") && !event.repeat && !talk.disabled) {
      event.preventDefault();
      void invoke("set_firstmate_talk", { active: true }).catch((reason) => {
        byId<HTMLElement>("assistant-voice-hint").hidden = false;
        byId<HTMLElement>("assistant-voice-hint").textContent = String(reason);
      });
    }
  });
  talk.addEventListener("keyup", (event) => {
    if (event.key === " " || event.key === "Enter") releaseTalk();
  });
  window.addEventListener("blur", releaseTalk);
  byId<HTMLSelectElement>("assistant-mode").addEventListener("change", (event) => {
    draft().app.orchestrator.mode = (event.currentTarget as HTMLSelectElement).value as
      "firstmate" | "live";
    changed();
    render();
  });
  byId<HTMLButtonElement>("assistant-pick-firstmate").addEventListener("click", () => {
    const button = byId<HTMLButtonElement>("assistant-pick-firstmate");
    button.disabled = true;
    open({ directory: true, multiple: false, title: "Choose Firstmate checkout" }).then(
      (picked) => {
        button.disabled = false;
        if (typeof picked === "string" && picked) {
          const trusted = window.confirm(
            `Trust and launch Pi with instructions and extensions from this Firstmate folder?\n\n${picked}\n\nOnly choose a checkout you trust.`,
          );
          if (!trusted) return;
          draft().app.orchestrator.firstmatePath = picked;
          draft().app.orchestrator.trustedFirstmatePath = picked;
          changed();
          render();
        }
      },
      () => {
        button.disabled = false;
      },
    );
  });
  byId<HTMLInputElement>("assistant-name").addEventListener("input", (event) => {
    draft().app.orchestrator.displayName = (event.currentTarget as HTMLInputElement).value;
    changed();
  });
  byId<HTMLSelectElement>("assistant-model").addEventListener("change", (event) => {
    draft().app.orchestrator.model = (event.currentTarget as HTMLSelectElement)
      .value as PreferencesFile["app"]["orchestrator"]["model"];
    changed();
  });
  byId<HTMLSelectElement>("assistant-thinking").addEventListener("change", (event) => {
    draft().app.orchestrator.thinking = (event.currentTarget as HTMLSelectElement)
      .value as PreferencesFile["app"]["orchestrator"]["thinking"];
    changed();
  });
  byId<HTMLTextAreaElement>("assistant-system-prompt").addEventListener("input", (event) => {
    draft().app.orchestrator.systemPrompt = (event.currentTarget as HTMLTextAreaElement).value;
    changed();
  });
  byId<HTMLButtonElement>("assistant-toggle").addEventListener("click", () => {
    draft().app.orchestrator.enabled = !draft().app.orchestrator.enabled;
    changed();
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
