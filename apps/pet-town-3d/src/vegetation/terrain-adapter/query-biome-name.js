/** Terrain and block classification, height snapshots, shoreline distances, ocean detection, and ground color sampling. */

import { isFiniteTerrainValue } from "./is-finite-terrain-value.js";
export function queryBiomeName(adapter, value26, value27) {
  if (typeof adapter.terrain.biomeAt != `function`) {
    return null;
  }
  try {
    let biomeAtResult = adapter.terrain.biomeAt(value26, value27);
    let result38 = adapter.terrain.BIOMES || adapter.terrain.biomes;
    if (typeof biomeAtResult == `string`) {
      return biomeAtResult;
    }
    if (biomeAtResult && typeof biomeAtResult == `object`) {
      return String(biomeAtResult.name ?? biomeAtResult.id ?? biomeAtResult.type);
    }
    if (isFiniteTerrainValue(biomeAtResult) && result38) {
      return Array.isArray(result38)
        ? (result38[biomeAtResult]?.name ?? result38[biomeAtResult])
        : Object.keys(result38).find((value28) => result38[value28] === biomeAtResult);
    }
  } catch {}
  return null;
}
