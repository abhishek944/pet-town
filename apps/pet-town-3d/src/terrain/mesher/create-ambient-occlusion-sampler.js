/** Typed buffer growth, beveled chunk construction, grass lip geometry and voxel hashing. */
import { terrainState } from "../state.js";
export function createAmbientOcclusionSampler(state) {
  return function (value35, value36, value37, nValue, value38, value39) {
    let n2 = nValue.n;
    let U2 = nValue.U;
    let V2 = nValue.V;
    let result49 = value35 + n2[0];
    let result50 = value36 + n2[1];
    let result51 = value37 + n2[2];
    let result52 = value38 ? 1 : -1;
    let result53 = value39 ? 1 : -1;
    let callbackResult = state.isSolid(
      result49 + U2[0] * result52,
      result50 + U2[1] * result52,
      result51 + U2[2] * result52,
    );
    let callbackResult2 = state.isSolid(
      result49 + V2[0] * result53,
      result50 + V2[1] * result53,
      result51 + V2[2] * result53,
    );
    let callbackResult3 = state.isSolid(
      result49 + U2[0] * result52 + V2[0] * result53,
      result50 + U2[1] * result52 + V2[1] * result53,
      result51 + U2[2] * result52 + V2[2] * result53,
    );
    let result54 =
      callbackResult && callbackResult2
        ? 0
        : 3 - (callbackResult + callbackResult2 + callbackResult3);
    let index24 = 0;
    let index25 = 0;
    for (let index26 = 0; index26 < 3; index26++) {
      let result55 = value35 + n2[0] * (index26 + 1);
      let result56 = value36 + n2[1] * (index26 + 1);
      let result57 = value37 + n2[2] * (index26 + 1);
      for (let result58 = value38 - 2; result58 <= value38 + 1; result58++) {
        for (let result59 = value39 - 2; result59 <= value39 + 1; result59++) {
          let result60 = result58 + 0.5 - value38;
          let result61 = result59 + 0.5 - value39;
          let result62 = index26 + 0.5;
          let result63 =
            1 / (0.35 + result60 * result60 + result61 * result61 + result62 * result62 * 1.4);
          index25 += result63;
          if (
            state.isSolid(
              result55 + U2[0] * result58 + V2[0] * result59,
              result56 + U2[1] * result58 + V2[1] * result59,
              result57 + U2[2] * result58 + V2[2] * result59,
            )
          ) {
            index24 += result63;
          }
        }
      }
    }
    index24 /= index25;
    return (
      terrainState.voxelAmbientOcclusionLevels[result54] * (1 - 0.75 * Math.min(1, index24 * 1.25))
    );
  };
}
