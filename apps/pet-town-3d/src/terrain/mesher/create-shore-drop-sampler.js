/** Typed buffer growth, beveled chunk construction, grass lip geometry and voxel hashing. */
import { terrainState } from "../state.js";
import { distanceToTerrainSegment } from "./distance-to-terrain-segment.js";
export function createShoreDropSampler(state) {
  return function (value11, value12) {
    let result16 = value11 + state.halfSize;
    let result17 = value12 + state.halfSize;
    let result18 = Math.floor(result16);
    let result19 = Math.floor(result17);
    let result20 = 9;
    for (let result22 = -1; result22 <= 1; result22++) {
      for (let result23 = -1; result23 <= 1; result23++) {
        let result24 = result18 + result23;
        let result25 = result19 + result22;
        if (
          state.columnTop(result24, result25) === terrainState.shoreSurfaceBlockHeight &&
          state.isLowShore(result24, result25)
        ) {
          if (state.columnTop(result24 + 1, result25) < terrainState.shoreSurfaceBlockHeight) {
            result20 = Math.min(
              result20,
              distanceToTerrainSegment(
                result16,
                result17,
                result24 + 1,
                result25,
                result24 + 1,
                result25 + 1,
              ),
            );
          }
          if (state.columnTop(result24 - 1, result25) < terrainState.shoreSurfaceBlockHeight) {
            result20 = Math.min(
              result20,
              distanceToTerrainSegment(
                result16,
                result17,
                result24,
                result25,
                result24,
                result25 + 1,
              ),
            );
          }
          if (state.columnTop(result24, result25 + 1) < terrainState.shoreSurfaceBlockHeight) {
            result20 = Math.min(
              result20,
              distanceToTerrainSegment(
                result16,
                result17,
                result24,
                result25 + 1,
                result24 + 1,
                result25 + 1,
              ),
            );
          }
          if (state.columnTop(result24, result25 - 1) < terrainState.shoreSurfaceBlockHeight) {
            result20 = Math.min(
              result20,
              distanceToTerrainSegment(
                result16,
                result17,
                result24,
                result25,
                result24 + 1,
                result25,
              ),
            );
          }
        }
      }
    }
    if (result20 >= terrainState.shoreEdgeFalloff) {
      return 0;
    }
    let result21 = 1 - result20 / terrainState.shoreEdgeFalloff;
    return result21 * result21 * (3 - 2 * result21);
  };
}
