/** Distance-along-polyline sampling and deterministic voxel island generation. */

import { terrainState } from "../state.js";
import { clampTerrainScalar } from "../interpolation/clamp-terrain-scalar.js";
import { hashIntegerCoordinates } from "../../math/random/hash-integer-coordinates.js";
export function fillIslandVoxels(island) {
  island.strataMaterials = [
    terrainState.terrainBlockIds.CLAY,
    terrainState.terrainBlockIds.SANDSTONE,
    terrainState.terrainBlockIds.STONE,
    terrainState.terrainBlockIds.DARKSTONE,
  ];
  island.strataSequence = [
    terrainState.terrainBlockIds.DARKSTONE,
    terrainState.terrainBlockIds.STONE,
    terrainState.terrainBlockIds.SANDSTONE,
    terrainState.terrainBlockIds.CLAY,
    terrainState.terrainBlockIds.STONE,
    terrainState.terrainBlockIds.SANDSTONE,
    terrainState.terrainBlockIds.CLAY,
    terrainState.terrainBlockIds.STONE,
    terrainState.terrainBlockIds.CLAY,
    terrainState.terrainBlockIds.SANDSTONE,
  ];
  island.isStrataMaterial = (value12) =>
    value12 === terrainState.terrainBlockIds.CLAY ||
    value12 === terrainState.terrainBlockIds.SANDSTONE ||
    value12 === terrainState.terrainBlockIds.STONE ||
    value12 === terrainState.terrainBlockIds.DARKSTONE;
  island.blocks = new Uint8Array(655360);
  island.voxelIndex = (value13, value14, value15) => (value15 * 128 + value13) * 40 + value14;
  for (let index25 = 0; index25 < 128; index25++) {
    for (let index26 = 0; index26 < 128; index26++) {
      let result80 = index26 - 64 + 0.5;
      let result81 = index25 - 64 + 0.5;
      let result82 = index25 * 128 + index26;
      let result83 = island.heights[result82];
      let result84 = island.surfaceTypes[result82];
      let callback7 = (value16, value17) => {
        let clampTerrainScalarResult4 = clampTerrainScalar(index26 + value16, 0, 127);
        let clampTerrainScalarResult5 = clampTerrainScalar(index25 + value17, 0, 127);
        return island.heights[clampTerrainScalarResult5 * 128 + clampTerrainScalarResult4];
      };
      let result85 =
        Math.max(
          result83 - callback7(1, 0),
          result83 - callback7(-1, 0),
          result83 - callback7(0, 1),
          result83 - callback7(0, -1),
        ) >= 2;
      let result86 =
        result84 === terrainState.terrainBlockIds.SAND
          ? 2 + +(hashIntegerCoordinates(index26, index25, 3) > 0.5)
          : result85
            ? 1
            : 2;
      let result87 = Math.max(
        -1,
        Math.min(1, Math.round(1.6 * island.noise(result80 * 0.23 + 50, result81 * 0.23 - 20))),
      );
      let result88 =
        0.3 * (island.strataHeights[result82] - 9) +
        2.2 * island.fbm(result80 * 0.05 + 40, result81 * 0.05, 2) +
        result87;
      let result89 = 4 + 0.45 * island.fbm(result80 * 0.03, result81 * 0.03 + 7, 2);
      for (let index27 = 0; index27 < result83; index27++) {
        let result90;
        let result91 = result83 - 1 - index27;
        if (result91 === 0) {
          result90 = result84;
        } else if (result91 <= result86) {
          result90 =
            result84 === terrainState.terrainBlockIds.SAND ||
            result84 === terrainState.terrainBlockIds.GRAVEL
              ? terrainState.terrainBlockIds.SAND
              : result84 === terrainState.terrainBlockIds.STONE
                ? terrainState.terrainBlockIds.STONE
                : terrainState.terrainBlockIds.DIRT;
        } else if (result84 === terrainState.terrainBlockIds.SAND && result91 <= result86 + 2) {
          result90 = terrainState.terrainBlockIds.SANDSTONE;
        } else {
          let result92 = Math.floor((index27 - 1.5 - result88) / result89);
          result90 =
            result92 < 0
              ? terrainState.terrainBlockIds.DARKSTONE
              : island.strataSequence[result92 % island.strataSequence.length];
        }
        island.blocks[island.voxelIndex(index26, index27, index25)] = result90;
      }
    }
  }
}
