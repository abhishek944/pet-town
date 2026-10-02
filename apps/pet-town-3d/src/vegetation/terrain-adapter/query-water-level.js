/** Terrain and block classification, height snapshots, shoreline distances, ocean detection, and ground color sampling. */

import { isFiniteTerrainValue } from "./is-finite-terrain-value.js";
export function queryWaterLevel(adapter) {
  let result31 = adapter.context.water || {};
  for (let result32 of [
    result31.level,
    result31.y,
    adapter.terrain.waterLevel,
    adapter.terrain.seaLevel,
    adapter.terrain.WATER_LEVEL,
    adapter.terrain.SEA,
    result31.mesh?.position?.y,
  ]) {
    if (isFiniteTerrainValue(result32)) {
      return result32;
    }
  }
  return NaN;
}
