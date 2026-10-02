/** Terrain-aware bed, coastal distance, openness and river current textures with incremental rebaking. */
/** Terrain-aware bed, coastal distance, openness and river current textures with incremental rebaking. */

import { waterState } from "../state.js";
export function createCoastDistanceTransform(region, state) {
  return (value31, value32, value33) => {
    for (let index13 = 0; index13 < region.height; index13++) {
      for (let index14 = 0; index14 < region.width; index14++) {
        let result61 = index13 * region.width + index14;
        let result62 =
          region.incremental &&
          (index14 === 0 ||
            index13 === 0 ||
            index14 === region.width - 1 ||
            index13 === region.height - 1);
        value31[result61] = value32(result61)
          ? 0
          : result62
            ? value33[region.textureIndexAt(index14, index13)]
            : 1e6;
      }
    }
    for (let index15 = 0; index15 < region.height; index15++) {
      for (let index16 = 0; index16 < region.width; index16++) {
        let result63 = index15 * region.width + index16;
        let result64 = value31[result63];
        if (index16 > 0) {
          result64 = Math.min(result64, value31[result63 - 1] + 1);
        }
        if (index15 > 0) {
          result64 = Math.min(result64, value31[result63 - region.width] + 1);
          if (index16 > 0) {
            result64 = Math.min(
              result64,
              value31[result63 - region.width - 1] + region.diagonalDistance,
            );
          }
          if (index16 < region.width - 1) {
            result64 = Math.min(
              result64,
              value31[result63 - region.width + 1] + region.diagonalDistance,
            );
          }
        }
        value31[result63] = result64;
      }
    }
    for (let result65 = region.height - 1; result65 >= 0; result65--) {
      for (let result66 = region.width - 1; result66 >= 0; result66--) {
        let result67 = result65 * region.width + result66;
        let result68 = value31[result67];
        if (result66 < region.width - 1) {
          result68 = Math.min(result68, value31[result67 + 1] + 1);
        }
        if (result65 < region.height - 1) {
          result68 = Math.min(result68, value31[result67 + region.width] + 1);
          if (result66 < region.width - 1) {
            result68 = Math.min(
              result68,
              value31[result67 + region.width + 1] + region.diagonalDistance,
            );
          }
          if (result66 > 0) {
            result68 = Math.min(
              result68,
              value31[result67 + region.width - 1] + region.diagonalDistance,
            );
          }
        }
        value31[result67] = Math.min(result68, waterState.waterCoastDistanceLimit);
      }
    }
  };
}
