/** Creature system namespace, world state, terrain queries, obstruction checks and nearby effects. */
import { getCreatureWorldExtent } from "./get-creature-world-extent.js";
export function isCreatureInsideWorld(value, value2) {
  let creatureWorldExtentResult = getCreatureWorldExtent();
  return (
    Math.abs(value) < creatureWorldExtentResult && Math.abs(value2) < creatureWorldExtentResult
  );
}
