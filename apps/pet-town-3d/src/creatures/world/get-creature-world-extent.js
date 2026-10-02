/** Creature system namespace, world state, terrain queries, obstruction checks and nearby effects. */
import { getCreatureTerrain } from "./get-creature-terrain.js";
export function getCreatureWorldExtent() {
  let size2 = getCreatureTerrain()?.size;
  return (Number.isFinite(size2) ? size2 : 96) / 2 - 1.5;
}
