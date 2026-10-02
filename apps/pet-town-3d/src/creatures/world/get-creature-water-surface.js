/** Creature system namespace, world state, terrain queries, obstruction checks and nearby effects. */
import { creaturesState } from "../state.js";
import { getCreatureWaterLevel } from "./get-creature-water-level.js";
export function getCreatureWaterSurface() {
  let surfaceY2 = creaturesState.creaturesRuntime.ctx.water?.surfaceY;
  return Number.isFinite(surfaceY2) ? surfaceY2 : getCreatureWaterLevel() - 0.12;
}
