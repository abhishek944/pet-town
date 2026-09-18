import { Actor, Color, Engine, Font, FontUnit, Label, vec } from "excalibur";
import {
  resolveIntent,
  type ActionIntent,
  type AgentView,
  type IntentResolution,
} from "@pet-village/core";
import { renderActionPalette } from "./palette-action-view";
import { installPaletteInput } from "./palette-input";
import { PETS } from "./pets";
import { SemanticActions } from "./semantic-actions";
import { paletteRegion, type HitRegion } from "./game-types";

const PANEL = Color.fromHex("#1d2028f2");
const TEXT = Color.fromHex("#f2f1f7");
const MUTED = Color.fromHex("#a4a7b1");
const VIOLET = Color.fromHex("#8172eb");

export class CommandPalette {
  readonly #actors: Actor[] = [];
  #open = false;
  #mode: "request" | "actions" = "request";
  #resolution: IntentResolution | null = null;
  #menuAgent: AgentView | null = null;
  #opener: HTMLElement | null = null;
  #menuIndex = 0;
  readonly #semanticActions: SemanticActions;

  constructor(
    readonly engine: Engine,
    readonly input: HTMLInputElement | null,
    readonly status: HTMLElement | null,
    readonly getAgents: () => readonly AgentView[],
    readonly run: (intent: ActionIntent) => string | null,
    readonly naturalLanguageEnabled: () => boolean,
    readonly changed: () => void,
  ) {
    this.#semanticActions = new SemanticActions(
      document.querySelector<HTMLElement>("#semantic-actions"),
      (intent) => this.#submit(intent),
      (index) => {
        this.#menuIndex = index;
        this.#render();
      },
    );
    installPaletteInput(
      this.input,
      () => ({ open: this.#open, mode: this.#mode, resolution: this.#resolution }),
      this.naturalLanguageEnabled,
      () => this.openRequest(),
      () => this.close(),
      () => this.#resolution?.status === "ready" && this.#submit(this.#resolution.intent),
      (index) => this.#runMenuIndex(index),
      () => this.#render(),
    );
  }

  get region(): HitRegion | null {
    return paletteRegion(this.engine, this.#open);
  }

  openRequest(seed = "", opener: HTMLElement | null = null): void {
    if (!this.naturalLanguageEnabled() || !this.input) return;
    this.#open = true;
    this.#mode = "request";
    this.#opener =
      opener ?? (document.activeElement instanceof HTMLElement ? document.activeElement : null);
    this.input.value = seed;
    this.input.classList.add("is-open");
    this.input.focus();
    this.#render();
  }

  openActions(agent: AgentView, opener: HTMLElement | null = null): void {
    this.#open = true;
    this.#mode = "actions";
    this.#menuAgent = agent;
    this.#menuIndex = 0;
    this.#opener = opener;
    this.#render();
    this.#semanticActions.show(agent);
  }

  close(): void {
    this.#open = false;
    this.#resolution = null;
    this.#menuAgent = null;
    this.#semanticActions.hide();
    this.#clear();
    this.input?.classList.remove("is-open");
    this.input?.blur();
    this.#opener?.focus();
    this.#opener = null;
    this.changed();
  }

  #render(): void {
    this.#clear();
    if (!this.#open) return;
    const width = Math.min(590, this.engine.drawWidth - 32);
    const left = (this.engine.drawWidth - width) / 2;
    const top = Math.max(22, this.engine.drawHeight - 208);
    this.#add(
      new Actor({ pos: vec(left + width / 2, top + 92), width, height: 184, color: PANEL, z: 30 }),
    );
    if (this.#mode === "actions" && this.#menuAgent) {
      const message = renderActionPalette(
        this.engine,
        this.#menuAgent,
        left,
        top,
        width,
        this.#actors,
        this.#menuIndex,
        (intent) => this.#submit(intent),
      );
      if (this.status) this.status.textContent = message;
    } else this.#renderRequest(left, top, width);
    this.changed();
  }

  #renderRequest(left: number, top: number, width: number): void {
    if (!this.input) return;
    this.#resolution = resolveIntent(this.input.value, this.getAgents(), PETS);
    this.#add(this.#label("Ask the village", left + 20, top + 28, 16, TEXT, true));
    this.#add(
      this.#label(
        this.input.value || "Type: Plum wave",
        left + 20,
        top + 59,
        13,
        this.input.value ? TEXT : MUTED,
      ),
    );
    const message =
      this.#resolution.status === "ready" ? this.#resolution.summary : this.#resolution.message;
    this.#add(
      this.#label(
        message,
        left + 20,
        top + 92,
        11,
        this.#resolution.status === "invalid" ? Color.fromHex("#f08c9c") : MUTED,
      ),
    );
    if (this.#resolution.status === "ready") {
      const run = new Actor({
        pos: vec(left + width - 70, top + 128),
        width: 104,
        height: 30,
        color: VIOLET,
        z: 31,
      });
      run.on(
        "pointerup",
        () => this.#resolution?.status === "ready" && this.#submit(this.#resolution.intent),
      );
      this.#add(run);
      this.#add(this.#label("Run action", left + width - 101, top + 133, 10, TEXT, true));
    }
    this.#add(this.#label("Enter Run action    Esc Cancel", left + 20, top + 133, 10, VIOLET));
    if (this.status) this.status.textContent = message;
  }

  #runMenuIndex(index: number): void {
    const agent = this.#menuAgent;
    const capability = agent ? PETS[agent.petId]?.capabilities[index] : undefined;
    if (agent && capability) this.#submit({ actorId: agent.id, capability });
  }

  #submit(intent: ActionIntent): void {
    const blocked = this.run(intent);
    if (blocked) {
      if (this.status) this.status.textContent = blocked;
      return;
    }
    this.close();
  }

  #label(text: string, x: number, y: number, size: number, color: Color, bold = false): Label {
    return new Label({
      text,
      pos: vec(x, y),
      color,
      z: 32,
      font: new Font({ size, unit: FontUnit.Px, family: "sans-serif", bold }),
    });
  }

  #add(actor: Actor): void {
    this.#actors.push(actor);
    this.engine.add(actor);
  }

  #clear(): void {
    for (const actor of this.#actors) actor.kill();
    this.#actors.length = 0;
  }
}
