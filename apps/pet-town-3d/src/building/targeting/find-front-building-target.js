/** Front-facing and cursor targets, ghost placement visualization and lantern light updates. */
import { buildingState } from "../state.js";
import { readTerrainBlock } from "../terrain-adapter/read-terrain-block.js";
import { isBuildingBlockSolid } from "../terrain-adapter/is-building-block-solid.js";
export function findFrontBuildingTarget() {
  let player2 = buildingState.buildingContext.player;
  let position2 = player2?.position;
  if (!position2) {
    return null;
  }
  let position3 = player2.forward ?? {
    x: Math.sin(player2.facing ?? 0),
    z: Math.cos(player2.facing ?? 0),
  };
  let result = Math.abs(position3.x) > 0.38 ? Math.sign(position3.x) : 0;
  let result2 = Math.abs(position3.z) > 0.38 ? Math.sign(position3.z) : 0;
  let result3 = Math.floor(position2.x) + result;
  let result4 = Math.floor(position2.z) + result2;
  let result5 = Math.floor(position2.y + 0.05);
  let result6 =
    Math.abs(position3.x) > Math.abs(position3.z)
      ? [-Math.sign(position3.x), 0, 0]
      : [0, 0, -Math.sign(position3.z)];
  let callback = (value, value2, value3, value4) => ({
    x: value,
    y: value2,
    z: value3,
    nx: value4[0],
    ny: value4[1],
    nz: value4[2],
    id: readTerrainBlock(value, value2, value3),
  });
  return isBuildingBlockSolid(result3, result5 + 1, result4)
    ? callback(
        result3,
        result5 + 1,
        result4,
        isBuildingBlockSolid(result3, result5 + 2, result4) ? result6 : [0, 1, 0],
      )
    : isBuildingBlockSolid(result3, result5, result4)
      ? callback(result3, result5, result4, [0, 1, 0])
      : isBuildingBlockSolid(result3, result5 - 1, result4)
        ? callback(result3, result5 - 1, result4, [0, 1, 0])
        : isBuildingBlockSolid(result3, result5 - 2, result4)
          ? callback(result3, result5 - 2, result4, [0, 1, 0])
          : null;
}
