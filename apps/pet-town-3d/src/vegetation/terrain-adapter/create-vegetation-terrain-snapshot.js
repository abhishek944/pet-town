/** Terrain and block classification, height snapshots, shoreline distances, ocean detection, and ground color sampling. */

import { isFiniteTerrainValue } from "./is-finite-terrain-value.js";
export function createVegetationTerrainSnapshot(adapter) {
  adapter.cellCount = adapter.columns * adapter.rows;
  adapter.snapshot = {
    minX: adapter.minX,
    minZ: adapter.minZ,
    nx: adapter.columns,
    nz: adapter.rows,
    maxY: adapter.maxHeight,
    h: new Float32Array(adapter.cellCount),
    water: new Float32Array(adapter.cellCount),
    top: new Int8Array(adapter.cellCount),
    biome: new Int8Array(adapter.cellCount),
    slope: new Float32Array(adapter.cellCount),
    shore: new Uint8Array(adapter.cellCount),
    valid: new Uint8Array(adapter.cellCount),
    waterLevel: NaN,
    rawBiome: new Int8Array(adapter.cellCount).fill(-1),
    waterTag: new Uint8Array(adapter.cellCount),
    blockMode: adapter.usesBlocks,
  };
  adapter.snapshot.waterNear = (value16, value17, value18, value19) => {
    let result33 = Math.max(0, Math.floor(value16 - adapter.minX));
    let result34 = Math.min(adapter.columns - 1, Math.floor(value18 - adapter.minX));
    let result35 = Math.max(0, Math.floor(value17 - adapter.minZ));
    let result36 = Math.min(adapter.rows - 1, Math.floor(value19 - adapter.minZ));
    for (let result35Value = result35; result35Value <= result36; result35Value++) {
      for (let result33Value = result33; result33Value <= result34; result33Value++) {
        if (!isNaN(adapter.snapshot.water[result35Value * adapter.columns + result33Value])) {
          return true;
        }
      }
    }
    return false;
  };
  adapter.snapshot.waterSurface = () => {
    let result37 = adapter.context.water || {};
    return isFiniteTerrainValue(result37.surfaceY) ? result37.surfaceY : adapter.waterLevel();
  };
  adapter.indexAt = (value20, value21) =>
    value20 < 0 || value21 < 0 || value20 >= adapter.columns || value21 >= adapter.rows
      ? -1
      : value21 * adapter.columns + value20;
  adapter.cellAt = (value22, value23) =>
    adapter.indexAt(Math.floor(value22 - adapter.minX), Math.floor(value23 - adapter.minZ));
  adapter.snapshot.idx = adapter.indexAt;
  adapter.snapshot.cellOf = adapter.cellAt;
  adapter.snapshot.cx = (value24) => adapter.minX + value24 + 0.5;
  adapter.snapshot.cz = (value25) => adapter.minZ + value25 + 0.5;
}
