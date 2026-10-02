/** Creature system namespace, world state, terrain queries, obstruction checks and nearby effects. */
import { sampleCreatureTerrainHeight } from "./sample-creature-terrain-height.js";
import { getCreatureWaterLevel } from "./get-creature-water-level.js";
export function isCreaturePositionUnderwater(value, value2) {
  let creatureTerrainHeightResult = sampleCreatureTerrainHeight(value, value2);
  return (
    creatureTerrainHeightResult != null &&
    creatureTerrainHeightResult < getCreatureWaterLevel() - 0.05
  );
}
