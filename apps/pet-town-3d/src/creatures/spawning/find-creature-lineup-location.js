/** Habitat-aware spawning, safe location selection and inspection lineups. */
import { getCreatureWorldExtent } from "../world/get-creature-world-extent.js";
import { sampleCreatureTerrainHeight } from "../world/sample-creature-terrain-height.js";
import { getCreatureWaterLevel } from "../world/get-creature-water-level.js";
import { isCreaturePositionBlocked } from "../world/is-creature-position-blocked.js";
import { creaturesState } from "../state.js";
import { getCreatureTerrain } from "../world/get-creature-terrain.js";
import { sampleCreatureBiome } from "./sample-creature-biome.js";
export function findCreatureLineupLocation(value, value2) {
  let result = null;
  let result2 = 1 / 0;
  let creatureWorldExtentResult = getCreatureWorldExtent();
  for (
    let result3 = -creatureWorldExtentResult + 8;
    result3 < creatureWorldExtentResult - 8;
    result3 += 2
  ) {
    for (
      let result4 = -creatureWorldExtentResult + 8;
      result4 < creatureWorldExtentResult - 8;
      result4 += 2
    ) {
      let values = [];
      let enabled = true;
      for (let index3 = 0; index3 < value; index3++) {
        let result9 = result4 + (index3 - (value - 1) / 2) * value2;
        let creatureTerrainHeightResult = sampleCreatureTerrainHeight(result9, result3);
        if (
          creatureTerrainHeightResult == null ||
          creatureTerrainHeightResult < getCreatureWaterLevel() + 0.3 ||
          isCreaturePositionBlocked(result9, result3, 0.9) ||
          isCreaturePositionBlocked(result9, result3 + 2.5, 0.8)
        ) {
          enabled = false;
          break;
        }
        values.push(creatureTerrainHeightResult);
      }
      if (!enabled) {
        continue;
      }
      let result5 = values.reduce((value3, value4) => value3 + value4, 0) / value;
      let index = 0;
      for (let result10 of values) {
        index += (result10 - result5) ** 2;
      }
      let index2 = 0;
      for (let result11 = 2; result11 <= 7; result11++) {
        let creatureTerrainHeightResult2 = sampleCreatureTerrainHeight(result4, result3 + result11);
        if (creatureTerrainHeightResult2 == null) {
          index2 += 5;
          break;
        }
        if (creatureTerrainHeightResult2 > result5 + 0.5) {
          index2 += creatureTerrainHeightResult2 - result5;
        }
      }
      for (let index4 = 0; index4 < value; index4++) {
        let creatureTerrainHeightResult3 = sampleCreatureTerrainHeight(
          result4 + (index4 - (value - 1) / 2) * value2,
          result3 + 1,
        );
        if (creatureTerrainHeightResult3 != null && creatureTerrainHeightResult3 > result5 + 0.2) {
          index2 += 2;
        }
      }
      let result6 = ((value - 1) / 2) * value2;
      for (let result12 = 1; result12 <= 8; result12++) {
        for (let result13 of [-1, -0.5, 0, 0.5, 1]) {
          if (
            isCreaturePositionBlocked(
              result4 + result13 * result6 * (1 - result12 / 10),
              result3 + result12,
              0.5,
            )
          ) {
            index2 += 4;
          }
        }
      }
      let position2 =
        creaturesState.creaturesRuntime.ctx.player?.position ?? getCreatureTerrain()?.spawn;
      let result7 = position2 ? Math.hypot(position2.x - result4, position2.z - result3) : 99;
      let creatureBiomeResult = sampleCreatureBiome(result4, result3);
      let result8 =
        index +
        index2 * 3 +
        Math.hypot(result4, result3) * 0.01 +
        (result7 < 9 ? 50 : 0) +
        (creatureBiomeResult === `meadow` || creatureBiomeResult === `plains` ? 0 : 2);
      if (result8 < result2) {
        result2 = result8;
        result = {
          x: result4,
          z: result3,
          y: result5,
        };
      }
    }
  }
  return (
    result ?? {
      x: 0,
      z: 0,
      y: sampleCreatureTerrainHeight(0, 0) ?? 0,
    }
  );
}
