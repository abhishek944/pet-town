import { Actor, Circle, Color, vec } from "excalibur";
import type { AgentView } from "@pet-town/core";
import type { PetActor } from "./game-types";

export class SemanticVillage {
  readonly #buttons = new Map<string, HTMLButtonElement>();
  #focusIndicator?: Actor;
  #focusedId?: string;

  constructor(
    readonly root: HTMLElement | null,
    readonly actors: Map<string, PetActor>,
    readonly activate: (id: string) => void,
    readonly openActions: (id: string, opener: HTMLElement) => void,
  ) {}

  refreshFocus(): void {
    if (this.#focusedId) this.#showFocus(this.#focusedId);
  }

  update(agents: readonly AgentView[]): void {
    if (!this.root) return;
    const activeIds = new Set(agents.map((agent) => agent.id));
    for (const [id, button] of this.#buttons) {
      if (activeIds.has(id)) continue;
      button.remove();
      this.#buttons.delete(id);
    }
    for (const agent of agents) {
      let button = this.#buttons.get(agent.id);
      if (!button) {
        button = document.createElement("button");
        button.className = "semantic-pet";
        button.addEventListener("focus", () => this.#showFocus(agent.id));
        button.addEventListener("blur", () => this.#hideFocus());
        button.addEventListener("click", () => this.activate(agent.id));
        button.addEventListener("contextmenu", (event) => {
          event.preventDefault();
          this.openActions(agent.id, button!);
        });
        button.addEventListener("keydown", (event) => {
          if (event.key !== "ContextMenu" && !(event.shiftKey && event.key === "F10")) return;
          event.preventDefault();
          this.openActions(agent.id, button!);
        });
        this.root.append(button);
        this.#buttons.set(agent.id, button);
      }
      button.textContent = `${agent.name}, ${agent.state}. ${agent.detail ?? ""}`;
    }
  }

  #showFocus(id: string): void {
    this.#hideFocus();
    const pet = this.actors.get(id);
    if (!pet) return;
    const radius = Math.max(pet.visualWidth, pet.visualHeight) / 2 + 4;
    const indicator = new Actor({ pos: vec(0, -pet.visualHeight / 2), z: 4 });
    indicator.graphics.use(
      new Circle({
        radius,
        color: Color.Transparent,
        strokeColor: Color.fromHex("#8172eb"),
        lineWidth: 3,
      }),
    );
    this.#focusIndicator = indicator;
    this.#focusedId = id;
    pet.actor.addChild(indicator);
  }

  #hideFocus(): void {
    this.#focusIndicator?.kill();
    this.#focusIndicator = undefined;
    this.#focusedId = undefined;
  }
}
