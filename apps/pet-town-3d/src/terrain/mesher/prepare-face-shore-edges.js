/** Typed buffer growth, beveled chunk construction, grass lip geometry and voxel hashing. */
/** Typed buffer growth, beveled chunk construction, grass lip geometry and voxel hashing. */
import { terrainState } from "../state.js";
export function prepareFaceShoreEdges(face, chunk, state) {
  face.edgeTouchesShore = (value62, value63) => {
    if (!(face.shoreSubdivideU || face.shoreSubdivideV)) {
      return false;
    }
    let result119 = value62 ? face.frame.U : face.frame.V;
    let result120 = value62 ? face.frame.V : face.frame.U;
    if (
      result119[1] !== 0 ||
      face.y + (face.frame.o[1] + result120[1] * value63) !== terrainState.shoreSurfaceBlockHeight
    ) {
      return false;
    }
    for (let index35 = 0; index35 <= 4; index35++) {
      let result121 = index35 / 4;
      if (
        state.shoreDropFactor(
          face.x -
            state.halfSize +
            face.frame.o[0] +
            result119[0] * result121 +
            result120[0] * value63,
          face.z -
            state.halfSize +
            face.frame.o[2] +
            result119[2] * result121 +
            result120[2] * value63,
        ) > 0
      ) {
        return true;
      }
    }
    return false;
  };
  face.shoreLowV = face.shoreSubdivideU && face.edgeTouchesShore(true, 0);
  face.shoreHighV = face.shoreSubdivideU && face.edgeTouchesShore(true, 1);
  face.shoreLowU = face.shoreSubdivideV && face.edgeTouchesShore(false, 0);
  face.shoreHighU = face.shoreSubdivideV && face.edgeTouchesShore(false, 1);
  chunk.ensureCapacity(face.countU * face.countV, (face.countU - 1) * (face.countV - 1) * 6);
  face.cornerVertices = [-1, -1, -1, -1];
}
