import { petCreature } from "../interaction/pet-creature.js";
export function creatureActorPet(options) {
  petCreature(this, {
    external: true,
  });
  return true;
}
