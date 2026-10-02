/** Terrain and block classification, height snapshots, shoreline distances, ocean detection, and ground color sampling. */

import { isFiniteTerrainValue } from "./is-finite-terrain-value.js";
import { classifyVegetationSurface } from "./classify-vegetation-surface.js";
export function querySampleColumn(adapter, value14, value15) {
  let result5Result4 = adapter.topHeight(value14, value15);
  if (!adapter.usesBlocks) {
    return {
      y: isFiniteTerrainValue(result5Result4) ? result5Result4 : NaN,
      water: NaN,
      top: adapter.surfaceType(value14, value15),
    };
  }
  let result29 = isFiniteTerrainValue(result5Result4)
    ? Math.min(adapter.maxHeight + 2, Math.floor(result5Result4) + 3)
    : adapter.maxHeight + 2;
  let result30 = NaN;
  let index7 = 0;
  for (
    ;
    !adapter.isEmptyBlock(adapter.blockAt(value14, result29, value15)) &&
    !adapter.isWaterBlock(adapter.blockAt(value14, result29, value15)) &&
    index7++ < 64;
  ) {
    result29++;
  }
  for (; result29 >= -2; result29--) {
    let callback4Result = adapter.blockAt(value14, result29, value15);
    if (adapter.isWaterBlock(callback4Result)) {
      if (!isFiniteTerrainValue(result30)) {
        result30 = result29 + 1;
      }
      continue;
    }
    if (!adapter.isEmptyBlock(callback4Result)) {
      let callbackResult4 = adapter.blockName(callback4Result);
      return {
        y: result29 + 1,
        water: result30,
        top: callbackResult4 ? classifyVegetationSurface(callbackResult4) : -1,
      };
    }
  }
  return {
    y: isFiniteTerrainValue(result5Result4) ? result5Result4 : NaN,
    water: result30,
    top: -1,
  };
}
