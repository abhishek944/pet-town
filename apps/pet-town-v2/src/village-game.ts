import { Color, DisplayMode, Engine } from "excalibur";
import { invoke } from "@tauri-apps/api/core";
import { CAPABILITIES, type ActionIntent, type AgentView } from "@pet-town/core";
import { focusAgent } from "./agent-focus";
import { listAgents } from "./agent-source";
import { CommandPalette } from "./command-palette";
import { petHitRegion, petLabelHitRegion, type HitRegion, type PetActor } from "./game-types";
import { InteractionRuntime } from "./interaction-runtime";
import { PetGraphics } from "./pet-graphics";
import { PetMenu } from "./pet-menu";
import { drawPlayroomHeader } from "./playroom-view";
import type { V2Preferences } from "./preferences";
import { PetDomView } from "./pet-label-view";
import { SemanticVillage } from "./semantic-village";
import { VillageMotion } from "./village-motion";

const POLL_MS = 1_000;
const HIT_REGION_MS = 33;

export class VillageGame {
  readonly #engine: Engine;
  readonly #actors = new Map<string, PetActor>();
  readonly #graphics: PetGraphics;
  readonly #runtime: InteractionRuntime;
  readonly #motion: VillageMotion;
  readonly #palette: CommandPalette;
  readonly #petMenu: PetMenu;
  readonly #semantic: SemanticVillage;
  #preferences: V2Preferences;
  #agents: readonly AgentView[] = [];

  constructor(
    readonly mode: "overlay" | "playroom",
    preferences: V2Preferences,
  ) {
    this.#preferences = preferences;
    this.#engine = new Engine({
      canvasElementId: "game",
      displayMode: DisplayMode.FillContainer,
      backgroundColor: mode === "playroom" ? Color.fromHex("#151921") : Color.Transparent,
      suppressPlayButton: true,
      antialiasing: true,
      enableCanvasTransparency: true,
    });
    this.#graphics = new PetGraphics(this.#engine);
    this.#runtime = new InteractionRuntime(
      this.#actors,
      (actor) => this.#engine.add(actor),
      (pet) => this.#graphics.restore(pet, this.#preferences),
      (pet, capability) => this.#graphics.useCapability(pet, capability, this.#preferences),
      () => this.#preferences.reducedMotion,
    );
    this.#semantic = new SemanticVillage(
      document.querySelector<HTMLElement>("#semantic-village"),
      this.#actors,
      (id) => focusAgent(id),
      (id, opener) => this.#openPetMenu(id, opener),
    );
    this.#palette = new CommandPalette(
      this.#engine,
      document.querySelector<HTMLInputElement>("#command-input"),
      document.querySelector<HTMLElement>("#command-status"),
      () => this.#agents,
      (intent) => this.#runIntent(intent),
      () => this.#preferences.naturalLanguageEnabled,
      () => this.#reportHitRegions(),
    );
    this.#motion = new VillageMotion(
      this.#engine,
      this.mode,
      this.#actors,
      this.#graphics,
      this.#runtime,
      () => this.#preferences,
      () => this.#semantic.refreshFocus(),
      new PetDomView(
        document.querySelector("#pet-labels"),
        this.#engine,
        (id) => focusAgent(id),
        (id, x, y) => this.#openPetMenu(id, null, x, y),
      ),
      () => this.#palette.region !== null,
    );
    this.#petMenu = new PetMenu(
      (intent) => this.#runIntent(intent),
      () => this.#reportHitRegions(),
    );
    this.#engine.on("postupdate", () => this.#motion.advance());
  }

  async start(): Promise<void> {
    await this.#graphics.load();
    await this.#engine.start();
    if (this.mode === "playroom") drawPlayroomHeader(this.#engine);
    this.#agents = (await listAgents()) ?? [];
    this.#reconcile();
    this.#schedulePoll();
    this.#reportHitRegions();
    window.setInterval(() => this.#reportHitRegions(), HIT_REGION_MS);
    void invoke("show_village").catch(() => undefined);
  }

  async refreshCapabilityMappings(): Promise<void> {
    await this.#graphics.refresh(this.#actors.values(), this.#preferences);
  }

  updatePreferences(preferences: V2Preferences): void {
    this.#preferences = preferences;
    for (const pet of this.#actors.values()) this.#graphics.applyPreferences(pet, preferences);
    this.#motion.resetLayout();
    this.#motion.applyLayout(this.#agents);
    this.#semantic.refreshFocus();
    if (!preferences.naturalLanguageEnabled) this.#palette.close();
  }

  #reconcile(): void {
    for (const [id, pet] of this.#actors) {
      if (this.#agents.some((agent) => agent.id === id)) continue;
      this.#runtime.removeAgent(id);
      this.#petMenu.close(false);
      pet.actor.kill();
      pet.label.kill();
      this.#actors.delete(id);
    }
    this.#agents.forEach((agent) => {
      const existing = this.#actors.get(agent.id);
      if (!existing) {
        const created = this.#graphics.create(agent, 0, this.#motion.baseline(), this.#preferences);
        if (created) this.#actors.set(agent.id, created);
      } else if (existing.agent.state !== agent.state) {
        this.#runtime.interruptFor(agent.id, agent.state);
        existing.agent = agent;
        this.#graphics.updateLabel(existing);
        this.#graphics.restore(existing, this.#preferences);
      } else {
        existing.agent = agent;
        this.#graphics.updateLabel(existing);
      }
    });
    this.#motion.applyLayout(this.#agents);
    this.#semantic.update(this.#agents);
    this.#semantic.refreshFocus();
  }

  #openPetMenu(id: string, opener: HTMLElement | null = null, x?: number, y?: number): void {
    const pet = this.#actors.get(id);
    if (pet)
      this.#petMenu.open(
        pet.agent,
        x ?? pet.actor.pos.x,
        y ?? pet.actor.pos.y,
        opener,
        x !== undefined && y !== undefined,
      );
  }

  #runIntent(candidate: ActionIntent): string | null {
    const spec = CAPABILITIES[candidate.capability];
    const targetId =
      candidate.targetId ??
      (spec.requiresTarget
        ? this.#agents.find((agent) => agent.id !== candidate.actorId)?.id
        : undefined);
    const intent = {
      ...candidate,
      targetId,
      item: candidate.item ?? (spec.requiresItem ? ("ball" as const) : undefined),
    };
    return this.#runtime.run(intent, this.#agents);
  }

  #reportHitRegions(): void {
    const dragging = [...this.#actors.values()].some((pet) => pet.dragging);
    const regions: HitRegion[] = dragging
      ? [{ x: 0, y: 0, width: this.#engine.drawWidth, height: this.#engine.drawHeight }]
      : [...this.#actors.values()].flatMap((pet) => [
          petHitRegion(pet),
          ...(this.#preferences.showLabels ? [petLabelHitRegion(pet)] : []),
        ]);
    const palette = this.#palette.region;
    if (palette) regions.push(palette);
    regions.push(...this.#petMenu.regions);
    void invoke("set_hit_regions", { regions }).catch(() => undefined);
  }

  #schedulePoll(): void {
    window.setTimeout(async () => {
      const agents = await listAgents();
      if (agents !== null) {
        this.#agents = agents;
        this.#reconcile();
        this.#reportHitRegions();
      }
      this.#schedulePoll();
    }, POLL_MS);
  }
}
