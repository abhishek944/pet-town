/** Distance-along-polyline sampling and deterministic voxel island generation. */

import { terrainState } from "../state.js";
import { hashIntegerCoordinates } from "../../math/random/hash-integer-coordinates.js";
export function addCliffOutcrops(island) {
  {
    let values4 = [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ];
    for (let result101 = 1; result101 < 127; result101++) {
      for (let result102 = 1; result102 < 127; result102++) {
        let result103 = island.heights[result101 * 128 + result102];
        for (let index32 = 0; index32 < 4; index32++) {
          let result104 = result102 + values4[index32][0];
          let result105 = result101 + values4[index32][1];
          let result106 = result105 * 128 + result104;
          let result107 = island.heights[result106];
          if (
            result103 - result107 < 4 ||
            result107 < 8 ||
            island.flags[result106] & 15 ||
            hashIntegerCoordinates(
              Math.floor(((result102 + result104) * 0.5) / 2) * 2 + index32 * 101,
              Math.floor(((result101 + result105) * 0.5) / 2) * 2,
              island.seed + 77,
            ) > 0.13 ||
            island.blocks[island.voxelIndex(result104, result107, result105)]
          ) {
            continue;
          }
          let result108 = Math.min(
            result103 - result107 - 2,
            1 + Math.floor(hashIntegerCoordinates(result104, result105, island.seed + 5) * 3),
          );
          for (
            let result107Value = result107;
            result107Value < result107 + result108;
            result107Value++
          ) {
            island.blocks[island.voxelIndex(result104, result107Value, result105)] =
              island.blocks[island.voxelIndex(result102, result107Value, result101)] ||
              terrainState.terrainBlockIds.STONE;
          }
          island.blocks[island.voxelIndex(result104, result107 + result108 - 1, result105)] =
            terrainState.terrainBlockIds.MOSSY;
        }
      }
    }
  }
}
