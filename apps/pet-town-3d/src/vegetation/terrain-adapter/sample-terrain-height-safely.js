/** Terrain and block classification, height snapshots, shoreline distances, ocean detection, and ground color sampling. */
import { isFiniteTerrainValue } from "./is-finite-terrain-value.js";
export let sampleTerrainHeightSafely = (value, ...value2) => {
  try {
    let valueResult = value(...value2);
    return isFiniteTerrainValue(valueResult)
      ? valueResult
      : valueResult && isFiniteTerrainValue(valueResult.y)
        ? valueResult.y
        : NaN;
  } catch {
    return NaN;
  }
};
