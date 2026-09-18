import { vec, type Engine } from "excalibur";
import type { AgentView } from "@pet-village/core";
import { rosterLayout, type PetActor } from "./game-types";
import type { InteractionRuntime } from "./interaction-runtime";
import type { PetGraphics } from "./pet-graphics";
import type { PetDomView } from "./pet-label-view";
import type { V2Preferences } from "./preferences";

type Mode = "overlay" | "playroom";

export class VillageMotion {
  #layoutKey = "";
  #layoutWidth = 0;

  constructor(
    readonly engine: Engine,
    readonly mode: Mode,
    readonly actors: Map<string, PetActor>,
    readonly graphics: PetGraphics,
    readonly runtime: InteractionRuntime,
    readonly preferences: () => V2Preferences,
    readonly layoutChanged: () => void,
    readonly labels: PetDomView,
    readonly paletteOpen: () => boolean,
  ) {}

  resetLayout(): void {
    this.#layoutKey = "";
  }

  applyLayout(agents: readonly AgentView[]): void {
    if (agents.length === 0) {
      this.#layoutKey = "";
      this.#layoutWidth = this.engine.drawWidth;
      return;
    }
    const key = `${this.engine.drawWidth}:${agents.map((agent) => agent.id).join("|")}`;
    if (key === this.#layoutKey) return;
    this.#layoutKey = key;
    const previousWidth = this.#layoutWidth;
    this.#layoutWidth = this.engine.drawWidth;
    const layout = rosterLayout(this.engine.drawWidth, agents.length, this.mode === "playroom");
    agents.forEach((agent, index) => {
      const pet = this.actors.get(agent.id);
      if (!pet) return;
      if (pet.positioned && previousWidth > 0 && previousWidth !== this.engine.drawWidth)
        pet.actor.pos.x = (pet.actor.pos.x / previousWidth) * this.engine.drawWidth;
      const initialX =
        agents.length === 1 ? this.#seededX(agent.id) : layout.start + layout.spacing * index;
      this.graphics.updateLayout(
        pet,
        pet.positioned ? pet.actor.pos.x : initialX,
        this.baseline(),
        layout.scale,
        layout.labelChars,
        this.preferences(),
      );
    });
  }

  #seededX(id: string): number {
    let seed = 2_166_136_261;
    for (const character of id) seed = Math.imul(seed ^ character.charCodeAt(0), 16_777_619) >>> 0;
    const margin = 60;
    return margin + ((seed % 1_000) / 1_000) * Math.max(0, this.engine.drawWidth - margin * 2);
  }

  baseline(): number {
    return this.mode === "playroom" ? this.engine.drawHeight - 74 : this.engine.drawHeight - 12;
  }

  advance(): void {
    this.labels.update(this.actors, this.preferences(), this.paletteOpen());
    if (this.#layoutWidth !== this.engine.drawWidth) {
      this.#layoutKey = "";
      this.applyLayout([...this.actors.values()].map((pet) => pet.agent));
      this.layoutChanged();
    }
    const preferences = this.preferences();
    if (preferences.reducedMotion || !preferences.autonomyEnabled) {
      for (const pet of this.actors.values()) pet.actor.vel = vec(0, 0);
      return;
    }
    const speed =
      preferences.activityLevel === "calm" ? 18 : preferences.activityLevel === "playful" ? 36 : 26;
    for (const pet of this.actors.values()) {
      if (pet.agent.state !== "working" || this.runtime.isActive(pet.agent.id)) {
        pet.actor.vel = vec(0, 0);
        continue;
      }
      const halfWidth = pet.visualWidth / 2;
      if (pet.actor.pos.x <= halfWidth || pet.actor.pos.x >= this.engine.drawWidth - halfWidth) {
        pet.actor.pos.x = Math.max(
          halfWidth,
          Math.min(this.engine.drawWidth - halfWidth, pet.actor.pos.x),
        );
        this.graphics.setDirection(pet, pet.direction === 1 ? -1 : 1);
      }
      pet.actor.vel = vec(pet.direction * speed, 0);
    }
  }
}
