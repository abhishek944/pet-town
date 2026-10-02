/** Creature system namespace, world state, terrain queries, obstruction checks and nearby effects. */
import { creaturesState } from "../state.js";
export function getCreatureTerrain() {
  return creaturesState.creaturesRuntime?.ctx.terrain;
}
