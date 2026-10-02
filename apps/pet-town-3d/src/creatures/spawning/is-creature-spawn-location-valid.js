/** Habitat-aware spawning, safe location selection and inspection lineups. */
import { isCreatureInsideWorld } from "../world/is-creature-inside-world.js";
import { sampleCreatureTerrainHeight } from "../world/sample-creature-terrain-height.js";
import { getCreatureWaterLevel } from "../world/get-creature-water-level.js";
import { creaturesState } from "../state.js";
import { isCreaturePositionBlocked } from "../world/is-creature-position-blocked.js";
export function isCreatureSpawnLocationValid(value, value2, value3 = 0.3) {
  if (!isCreatureInsideWorld(value, value2)) {
    return false;
  }
  let creatureTerrainHeightResult = sampleCreatureTerrainHeight(value, value2);
  if (
    creatureTerrainHeightResult == null ||
    creatureTerrainHeightResult < getCreatureWaterLevel() + value3
  ) {
    return false;
  }
  let index = 0;
  for (let [result, result2] of creaturesState.creatureCardinalDirections) {
    let creatureTerrainHeightResult2 = sampleCreatureTerrainHeight(
      value + result * 0.8,
      value2 + result2 * 0.8,
    );
    if (creatureTerrainHeightResult2 == null) {
      return false;
    }
    index = Math.max(index, Math.abs(creatureTerrainHeightResult2 - creatureTerrainHeightResult));
  }
  return index > 1.05 ? false : !isCreaturePositionBlocked(value, value2, 0.8);
}
