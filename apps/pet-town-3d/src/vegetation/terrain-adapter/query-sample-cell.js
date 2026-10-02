/** Terrain and block classification, height snapshots, shoreline distances, ocean detection, and ground color sampling. */

import { isFiniteTerrainValue } from "./is-finite-terrain-value.js";
import { vegetationState } from "../state.js";
import { classifyVegetationBiome } from "./classify-vegetation-biome.js";
export function querySampleCell(adapter, value29) {
  let result39 = value29 % adapter.columns;
  let result40 = (value29 / adapter.columns) | 0;
  let result41 = adapter.minX + result39 + 0.5;
  let result42 = adapter.minZ + result40 + 0.5;
  let result14Result = adapter.biomeName(result41, result42);
  adapter.snapshot.rawBiome[value29] =
    result14Result == null ? -1 : classifyVegetationBiome(result14Result);
  adapter.snapshot.waterTag[value29] =
    result14Result == null
      ? 0
      : /ocean|sea/i.test(result14Result)
        ? 1
        : /river|stream|creek/i.test(result14Result)
          ? 3
          : /pond|lake/i.test(result14Result)
            ? 2
            : 0;
  let result11Result = adapter.sampleColumn(result41, result42);
  adapter.snapshot.h[value29] = result11Result.y;
  adapter.snapshot.valid[value29] = +!!isFiniteTerrainValue(result11Result.y);
  let waterLevel2 = adapter.snapshot.waterLevel;
  let water2 = result11Result.water;
  if (
    !isFiniteTerrainValue(water2) &&
    isFiniteTerrainValue(waterLevel2) &&
    result11Result.y < waterLevel2 - 0.02
  ) {
    water2 = waterLevel2;
  }
  adapter.snapshot.water[value29] = isFiniteTerrainValue(water2) ? water2 : NaN;
  adapter.snapshot.top[value29] = isFiniteTerrainValue(water2)
    ? vegetationState.vegetationSurfaceIds.WATER
    : result11Result.top;
}
