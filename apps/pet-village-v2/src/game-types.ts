import type { Actor, Animation, Engine } from "excalibur";
import type { AgentView } from "@pet-village/core";

export const PET_LABEL_HEIGHT = 19;

export type PetActor = {
  actor: Actor;
  label: Actor;
  agent: AgentView;
  animations: Map<string, Animation>;
  layoutScale: number;
  labelChars: number;
  direction: -1 | 1;
  activeKey: string;
  visualWidth: number;
  visualHeight: number;
  labelWidth: number;
  positioned: boolean;
};

export type HitRegion = { x: number; y: number; width: number; height: number };

export function rosterLayout(width: number, count: number, playroom: boolean) {
  const spacing = Math.min(playroom ? 210 : 190, (width - 32) / count);
  return {
    spacing,
    start: (width - spacing * (count - 1)) / 2,
    scale: Math.max(0.58, Math.min(1, spacing / 118)),
    labelChars: Math.max(10, Math.min(20, Math.floor((spacing - 10) / 6.2))),
  };
}

export function petHitRegion(pet: PetActor): HitRegion {
  return {
    x: pet.actor.pos.x - pet.visualWidth / 2,
    y: pet.actor.pos.y - pet.visualHeight,
    width: pet.visualWidth,
    height: pet.visualHeight,
  };
}

export function petLabelHitRegion(pet: PetActor): HitRegion {
  return {
    x: pet.actor.pos.x - pet.labelWidth / 2,
    y: pet.actor.pos.y + pet.label.pos.y - PET_LABEL_HEIGHT / 2,
    width: pet.labelWidth,
    height: PET_LABEL_HEIGHT,
  };
}

export function paletteRegion(engine: Engine, open: boolean): HitRegion | null {
  if (!open) return null;
  const width = Math.min(590, engine.drawWidth - 32);
  return {
    x: (engine.drawWidth - width) / 2,
    y: Math.max(22, engine.drawHeight - 208),
    width,
    height: 184,
  };
}
