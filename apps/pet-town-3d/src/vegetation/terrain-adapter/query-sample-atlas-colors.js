/** Terrain and block classification, height snapshots, shoreline distances, ocean detection, and ground color sampling. */

import { isFiniteTerrainValue } from "./is-finite-terrain-value.js";
export function querySampleAtlasColors(adapter) {
  let atlas2 = adapter.terrain.atlas;
  if (!atlas2 || !atlas2.data || !isFiniteTerrainValue(atlas2.count) || atlas2.count <= 0) {
    return null;
  }
  let result82 = Math.round(Math.sqrt(atlas2.data.length / 4 / atlas2.count));
  if (!result82) {
    return null;
  }
  let values2 = [];
  for (let index27 = 0; index27 < atlas2.count; index27++) {
    let result83 = index27 * result82 * result82 * 4;
    let index28 = 0;
    let index29 = 0;
    let index30 = 0;
    let index31 = 0;
    for (
      let result83Value = result83;
      result83Value < result83 + result82 * result82 * 4;
      result83Value += 28
    ) {
      index28 += adapter.srgbByteToLinear(atlas2.data[result83Value]);
      index29 += adapter.srgbByteToLinear(atlas2.data[result83Value + 1]);
      index30 += adapter.srgbByteToLinear(atlas2.data[result83Value + 2]);
      index31++;
    }
    values2.push([index28 / index31, index29 / index31, index30 / index31]);
  }
  return values2;
}
