/** Creature proximity, petting dispatch, response messages and heart overlays. */
import { hudState } from "../state.js";
export function getHudCreatures() {
  let creatures2 = hudState.hudContext.creatures;
  return Array.isArray(creatures2)
    ? creatures2
    : (creatures2?.list ?? creatures2?.all ?? creatures2?.items ?? creatures2?.creatures ?? []);
}
