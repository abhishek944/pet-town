import { CAPABILITIES, type ActionIntent, type AgentView } from "@pet-town/core";
import { PETS } from "./pets";

export class SemanticActions {
  readonly #buttons: HTMLButtonElement[] = [];

  constructor(
    readonly root: HTMLElement | null,
    readonly select: (intent: ActionIntent) => void,
    readonly focusIndex: (index: number) => void,
  ) {}

  show(agent: AgentView): void {
    this.hide();
    const capabilities = PETS[agent.petId]?.capabilities ?? [];
    capabilities.forEach((capability, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.setAttribute("role", "menuitem");
      button.textContent = `${index + 1}. ${CAPABILITIES[capability].label}`;
      button.addEventListener("focus", () => this.focusIndex(index));
      button.addEventListener("click", () => this.select({ actorId: agent.id, capability }));
      button.addEventListener("keydown", (event) => this.#moveFocus(event, index));
      this.root?.append(button);
      this.#buttons.push(button);
    });
    this.#buttons[0]?.focus();
  }

  hide(): void {
    for (const button of this.#buttons) button.remove();
    this.#buttons.length = 0;
  }

  #moveFocus(event: KeyboardEvent, index: number): void {
    const delta =
      event.key === "ArrowRight" || event.key === "ArrowDown"
        ? 1
        : event.key === "ArrowLeft" || event.key === "ArrowUp"
          ? -1
          : 0;
    if (!delta || this.#buttons.length === 0) return;
    event.preventDefault();
    this.#buttons[(index + delta + this.#buttons.length) % this.#buttons.length]?.focus();
  }
}
