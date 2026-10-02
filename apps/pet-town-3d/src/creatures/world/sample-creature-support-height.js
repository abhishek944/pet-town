/** Creature system namespace, world state, terrain queries, obstruction checks and nearby effects. */
import { sampleCreatureTerrainHeight } from "./sample-creature-terrain-height.js";
import { creaturesState } from "../state.js";
export function sampleCreatureSupportHeight(value, value2, value3 = 0) {
  let creatureTerrainHeightResult = sampleCreatureTerrainHeight(value, value2);
  if (creatureTerrainHeightResult == null) {
    return null;
  }
  let creatureTerrainHeightResultValue = creatureTerrainHeightResult;
  if (value3 > 0) {
    for (let [result, result2] of creaturesState.creatureCardinalDirections) {
      let creatureTerrainHeightResult2 = sampleCreatureTerrainHeight(
        value + result * value3,
        value2 + result2 * value3,
      );
      if (
        creatureTerrainHeightResult2 != null &&
        creatureTerrainHeightResult2 > creatureTerrainHeightResultValue &&
        creatureTerrainHeightResult2 - creatureTerrainHeightResult < 0.6
      ) {
        creatureTerrainHeightResultValue = creatureTerrainHeightResult2;
      }
    }
  }
  return creatureTerrainHeightResultValue;
}
