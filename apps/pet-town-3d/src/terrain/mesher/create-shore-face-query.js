/** Typed buffer growth, beveled chunk construction, grass lip geometry and voxel hashing. */
import { terrainState } from "../state.js";
export function createShoreFaceQuery(state) {
  return function (value13, value14, value15) {
    let result26 = terrainState.voxelFaceFrames[value15];
    for (let index2 = 0; index2 <= 4; index2++) {
      for (let index3 = 0; index3 <= 4; index3++) {
        let result27 = index3 / 4;
        let result28 = index2 / 4;
        let result29 = result26.o[0] + result26.U[0] * result27 + result26.V[0] * result28;
        let result30 = result26.o[1] + result26.U[1] * result27 + result26.V[1] * result28;
        let result31 = result26.o[2] + result26.U[2] * result27 + result26.V[2] * result28;
        if (
          !(value15 !== 2 && result30 < 0.999) &&
          state.shoreDropFactor(
            value13 - state.halfSize + result29,
            value14 - state.halfSize + result31,
          ) > 0
        ) {
          return true;
        }
      }
    }
    return false;
  };
}
