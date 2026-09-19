import { CAPABILITIES, type ActionIntent, type AgentView } from "@pet-town/core";
import { invoke } from "@tauri-apps/api/core";
import { PETS } from "./pets";
import type { HitRegion } from "./game-types";

const WAVE_ICON =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7.5 20.5v-6.2l-1.9-1.7c-.7-.7-.8-1.7-.2-2.4.6-.6 1.5-.6 2.1 0l1 1V6.6a1.4 1.4 0 0 1 2.8 0v4.1l.1-6a1.4 1.4 0 0 1 2.8 0V11l.1-4.2a1.4 1.4 0 0 1 2.8 0v6c0 4.2-2.6 7.7-6.3 7.7-1.1 0-2.1-.3-3.1-.9"/></svg>';
const PREFERENCES_ICON =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h9M17 7h3M4 17h3M11 17h9M13 4v6M8 14v6"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/></svg>';

export class PetMenu {
  #menu: HTMLElement | null = null;
  #backdrop: HTMLElement | null = null;
  #opener: HTMLElement | null = null;

  constructor(
    readonly run: (intent: ActionIntent) => string | null,
    readonly changed: () => void,
  ) {
    window.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && this.#menu) this.close();
      else if (event.key === "/" && this.#menu) this.close(false);
    });
  }

  get regions(): HitRegion[] {
    return [this.#backdrop, this.#menu]
      .filter((element): element is HTMLElement => Boolean(element))
      .map((element) => {
        const bounds = element.getBoundingClientRect();
        return { x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height };
      });
  }

  open(
    agent: AgentView,
    x: number,
    y: number,
    opener: HTMLElement | null = null,
    atPointer = false,
  ): void {
    this.close(false);
    this.#opener = opener;
    this.#backdrop = document.createElement("div");
    this.#backdrop.className = "pet-menu-backdrop";
    this.#backdrop.addEventListener("pointerdown", () => this.close());
    this.#menu = document.createElement("nav");
    this.#menu.className = "pet-menu";
    this.#menu.setAttribute("role", "menu");
    this.#menu.setAttribute("aria-label", `${agent.name} actions`);
    const capabilities = PETS[agent.petId]?.capabilities ?? [];
    const directActions = capabilities.includes("wave")
      ? (["wave"] as const)
      : capabilities.slice(0, 1);
    for (const capability of directActions) {
      const button = document.createElement("button");
      button.type = "button";
      button.setAttribute("role", "menuitem");
      button.innerHTML = `${WAVE_ICON}<span>${CAPABILITIES[capability].label}</span>`;
      button.addEventListener("click", () => {
        if (!this.run({ actorId: agent.id, capability })) this.close();
      });
      this.#menu.append(button);
    }
    this.#menu.append(this.#separator(), this.#preferencesButton());
    document.body.append(this.#backdrop, this.#menu);
    const targetLeft = atPointer ? x : x + 10;
    const targetTop = atPointer ? y : y - this.#menu.offsetHeight - 8;
    const left = Math.max(4, Math.min(innerWidth - this.#menu.offsetWidth - 4, targetLeft));
    const top = Math.max(4, Math.min(innerHeight - this.#menu.offsetHeight - 4, targetTop));
    this.#menu.style.left = `${left}px`;
    this.#menu.style.top = `${top}px`;
    this.#menu.querySelector<HTMLButtonElement>("button")?.focus();
    this.changed();
  }

  close(restoreFocus = true): void {
    this.#menu?.remove();
    this.#backdrop?.remove();
    this.#menu = null;
    this.#backdrop = null;
    if (restoreFocus) this.#opener?.focus();
    this.#opener = null;
    this.changed();
  }

  #separator(): HTMLElement {
    const separator = document.createElement("hr");
    separator.className = "pet-menu-separator";
    return separator;
  }

  #preferencesButton(): HTMLButtonElement {
    const button = document.createElement("button");
    button.type = "button";
    button.setAttribute("role", "menuitem");
    button.innerHTML = `${PREFERENCES_ICON}<span>Preferences…</span>`;
    button.addEventListener("click", () => {
      if ("__TAURI_INTERNALS__" in window) void invoke("open_settings");
      else window.open("/settings.html", "_blank");
      this.close();
    });
    return button;
  }
}
