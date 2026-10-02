/** Terrain and block classification, height snapshots, shoreline distances, ocean detection, and ground color sampling. */

import { isFiniteTerrainValue } from "./is-finite-terrain-value.js";
import { collectTerrainBlockNames } from "./collect-terrain-block-names.js";
import { vegetationState } from "../state.js";
import { classifyVegetationSurface } from "./classify-vegetation-surface.js";
export function configureVegetationBlockSampling(adapter) {
  adapter.blockNames = collectTerrainBlockNames(adapter.terrain);
  adapter.hasBlockSampler = typeof adapter.terrain.blockAt == `function`;
  adapter.blockName = (toLowerCaseValue) =>
    typeof toLowerCaseValue == `string`
      ? toLowerCaseValue.toLowerCase()
      : toLowerCaseValue && typeof toLowerCaseValue == `object`
        ? String(toLowerCaseValue.name ?? toLowerCaseValue.type ?? ``).toLowerCase()
        : adapter.blockNames.get(toLowerCaseValue);
  adapter.isEmptyBlock = (value7) => {
    if (value7 === 0 || value7 == null || value7 === false) {
      return true;
    }
    let callbackResult = adapter.blockName(value7);
    return callbackResult
      ? vegetationState.vegetationNonSolidBlockPattern.test(callbackResult)
      : false;
  };
  adapter.isWaterBlock = (value8) => {
    let callbackResult2 = adapter.blockName(value8);
    return !!callbackResult2 && /water/.test(callbackResult2);
  };
  adapter.blockAt = (value9, value10, value11) => {
    try {
      return adapter.terrain.blockAt(value9, value10, value11);
    } catch {
      return 0;
    }
  };
  adapter.usesBlocks = false;
  if (adapter.hasBlockSampler) {
    let index5 = 0;
    for (let index6 = 0; index6 < 40 && index5 < 3; index6++) {
      let result26 = adapter.minX + ((index6 * 37) % adapter.columns) + 0.5;
      let result27 = adapter.minZ + ((index6 * 61) % adapter.rows) + 0.5;
      let result5Result3 = adapter.topHeight(result26, result27);
      if (isFiniteTerrainValue(result5Result3)) {
        for (let result28 of [
          Math.floor(result5Result3) - 1,
          Math.floor(result5Result3) - 2,
          Math.floor(result5Result3),
          0,
        ]) {
          if (
            !adapter.isEmptyBlock(adapter.blockAt(result26, result28, result27)) ||
            adapter.isWaterBlock(adapter.blockAt(result26, result28, result27))
          ) {
            index5++;
            break;
          }
        }
      }
    }
    adapter.usesBlocks = index5 >= 2;
  }
  adapter.maxHeight = isFiniteTerrainValue(adapter.terrain.maxHeight)
    ? adapter.terrain.maxHeight
    : isFiniteTerrainValue(adapter.terrain.MAXH)
      ? adapter.terrain.MAXH
      : isFiniteTerrainValue(adapter.terrain.height)
        ? adapter.terrain.height
        : 64;
  adapter.surfaceType = (value12, value13) => {
    if (typeof adapter.terrain.surfaceAt != `function`) {
      return -1;
    }
    try {
      let surfaceAtResult = adapter.terrain.surfaceAt(value12, value13);
      let callbackResult3 = adapter.blockName(surfaceAtResult);
      return callbackResult3 ? classifyVegetationSurface(callbackResult3) : -1;
    } catch {
      return -1;
    }
  };
}
