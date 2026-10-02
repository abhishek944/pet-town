/** Terrain and block classification, height snapshots, shoreline distances, ocean detection, and ground color sampling. */

import { isFiniteTerrainValue } from "./is-finite-terrain-value.js";
import { vegetationState } from "../state.js";
import { vegetationFractalNoise2d } from "../random/vegetation-fractal-noise2d.js";
export function queryClassifyCell(adapter, value30) {
  let result43 = value30 % adapter.columns;
  let result44 = (value30 / adapter.columns) | 0;
  let result45 = adapter.minX + result43 + 0.5;
  let result46 = adapter.minZ + result44 + 0.5;
  let result47 = adapter.snapshot.h[value30];
  let index8 = 0;
  for (let [result50, result51] of [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ]) {
    let callback6Result = adapter.indexAt(result43 + result50, result44 + result51);
    if (callback6Result >= 0 && adapter.snapshot.valid[callback6Result]) {
      index8 = Math.max(index8, Math.abs(adapter.snapshot.h[callback6Result] - result47));
    }
  }
  adapter.snapshot.slope[value30] = index8;
  let result48 = adapter.snapshot.rawBiome[value30];
  if (!isNaN(adapter.snapshot.water[value30])) {
    result48 = vegetationState.vegetationBiomeIds.WATER;
  }
  let result49 = adapter.snapshot.top[value30];
  if (result48 < 0 || result48 === vegetationState.vegetationBiomeIds.MEADOW) {
    if (result49 === vegetationState.vegetationSurfaceIds.SAND) {
      result48 = vegetationState.vegetationBiomeIds.BEACH;
    } else {
      if (result49 === vegetationState.vegetationSurfaceIds.SNOW) {
        result48 = vegetationState.vegetationBiomeIds.SNOW;
      } else {
        if (result49 === vegetationState.vegetationSurfaceIds.STONE && result48 < 0) {
          result48 = vegetationState.vegetationBiomeIds.MOUNTAIN;
        }
      }
    }
  }
  if (result48 < 0) {
    result48 =
      result47 <=
        (isFiniteTerrainValue(adapter.snapshot.waterLevel)
          ? adapter.snapshot.waterLevel
          : adapter.snapshot.hMin) +
          1.2 && adapter.snapshot.shore[value30] <= 3
        ? vegetationState.vegetationBiomeIds.BEACH
        : result47 >= adapter.snapshot.hHigh
          ? result47 >= adapter.snapshot.hSnow
            ? vegetationState.vegetationBiomeIds.SNOW
            : vegetationState.vegetationBiomeIds.MOUNTAIN
          : vegetationFractalNoise2d(result45 * 0.045 + 31.7, result46 * 0.045 - 12.3, 99) > 0.53
            ? vegetationState.vegetationBiomeIds.FOREST
            : vegetationState.vegetationBiomeIds.MEADOW;
  }
  adapter.snapshot.biome[value30] = result48;
}
