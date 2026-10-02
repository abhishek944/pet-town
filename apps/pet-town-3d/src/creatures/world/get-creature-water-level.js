/** Creature system namespace, world state, terrain queries, obstruction checks and nearby effects. */
import { creaturesState } from "../state.js";
export function getCreatureWaterLevel() {
  let ctx2 = creaturesState.creaturesRuntime.ctx;
  let result = ctx2.terrain?.waterLevel ?? ctx2.water?.level ?? ctx2.waterLevel;
  return Number.isFinite(result) ? result : -1 / 0;
}
