/** Terrain and block classification, height snapshots, shoreline distances, ocean detection, and ground color sampling. */

import { isFiniteTerrainValue } from "./is-finite-terrain-value.js";
export function installVegetationSnapshotMethods(adapter) {
  adapter.snapshot.snapshot = function () {
    adapter.snapshot.waterLevel = adapter.waterLevel();
    for (let index23 = 0; index23 < adapter.cellCount; index23++) {
      adapter.sampleCell(index23);
    }
    let values = [];
    for (let index24 = 0; index24 < adapter.cellCount; index24 += 3) {
      if (adapter.snapshot.valid[index24] && isNaN(adapter.snapshot.water[index24])) {
        values.push(adapter.snapshot.h[index24]);
      }
    }
    values.sort((value31, value32) => value31 - value32);
    adapter.snapshot.hMin = values[0] ?? 0;
    adapter.snapshot.hMax = values[values.length - 1] ?? 1;
    adapter.snapshot.hHigh = values[Math.floor(values.length * 0.9)] ?? 1e9;
    adapter.snapshot.hSnow = values[Math.floor(values.length * 0.985)] ?? 1e9;
    if (adapter.snapshot.hHigh - adapter.snapshot.hMin < 6) {
      adapter.snapshot.hHigh = adapter.snapshot.hSnow = 1e9;
    }
    adapter.computeShoreDistance();
    adapter.computeOceanDistance();
    adapter.computeLandDistance();
    adapter.computeWideWater();
    for (let index25 = 0; index25 < adapter.cellCount; index25++) {
      adapter.classifyCell(index25);
    }
    adapter.snapshot.ground = adapter.sampleTerrainColors();
    let index22 = 0;
    for (let index26 = 0; index26 < adapter.cellCount; index26++) {
      index22 += adapter.snapshot.valid[index26];
    }
    adapter.snapshot.validCount = index22;
    return adapter.snapshot;
  };
  adapter.snapshot.resample = function (value33) {
    adapter.sampleCell(value33);
    adapter.classifyCell(value33);
  };
  adapter.snapshot.surfaceAt = (value34, value35) => {
    let callback7Result = adapter.cellAt(value34, value35);
    if (callback7Result < 0) {
      return NaN;
    }
    if (adapter.usesBlocks || typeof adapter.terrain.topY == `function`) {
      return adapter.snapshot.h[callback7Result];
    }
    let result6Result = adapter.smoothHeight(value34, value35);
    return isFiniteTerrainValue(result6Result)
      ? result6Result
      : adapter.snapshot.h[callback7Result];
  };
  adapter.snapshot.liveSurface = (value36, value37) => adapter.sampleColumn(value36, value37).y;
}
