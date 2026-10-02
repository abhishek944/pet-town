/** Distance-along-polyline sampling and deterministic voxel island generation. */

import { smoothTerrainScalar } from "../interpolation/smooth-terrain-scalar.js";
import { interpolateTerrainScalar } from "../interpolation/interpolate-terrain-scalar.js";
import { terrainState } from "../state.js";
import { measurePolylineDistance } from "./measure-polyline-distance.js";
export function shapeIslandElevation(island) {
  for (let index = 0; index < 128; index++) {
    for (let index2 = 0; index2 < 128; index2++) {
      let result = index2 - 64 + 0.5;
      let result2 = index - 64 + 0.5;
      let result3 = index * 128 + index2;
      let result4 = result + 10 * island.fbm(result * 0.012 + 5.1, result2 * 0.012, 2);
      let result5 = result2 + 10 * island.fbm(result * 0.012, result2 * 0.012 - 7.7, 2);
      let result6 = Math.hypot(result * 0.96, result2 * 1.02) / 57;
      result6 += 0.2 * island.fbm(result * 0.017 + 3, result2 * 0.017 - 2, 3);
      let result7 = Math.min(index2, index, 127 - index2, 127 - index);
      result6 += 0.45 * smoothTerrainScalar(20, 4, result7);
      let smoothTerrainScalarResult = smoothTerrainScalar(1.06, 0.92, result6);
      island.landMask[result3] = smoothTerrainScalarResult;
      island.coastMask[result3] = smoothTerrainScalar(0.72, 0.88, result6);
      let result8 = 9.35 + 0.95 * island.fbm(result4 * 0.03, result5 * 0.03, 2);
      result8 = interpolateTerrainScalar(
        result8,
        Math.min(result8, 8.3 + 0.5 * island.fbm(result * 0.07, result2 * 0.07, 2)),
        smoothTerrainScalar(0.7, 0.9, result6),
      );
      let callback4 = (value2, value3) =>
        smoothTerrainScalar(value2 - 0.012, value2 + 0.012, value3);
      let hypotResult = Math.hypot(result * 0.9, result2);
      if (hypotResult < 11) {
        island.flags[result3] |= 16;
      }
      let result9 = Math.floor(index2 / 2) * 2 + 1 - 64;
      let result10 = Math.floor(index / 2) * 2 + 1 - 64;
      let result11 = result9 + 10 * island.fbm(result9 * 0.012 + 5.1, result10 * 0.012, 2);
      let result12 = result10 + 10 * island.fbm(result9 * 0.012, result10 * 0.012 - 7.7, 2);
      let result13 =
        Math.hypot(result9 * 0.96, result10 * 1.02) / 57 +
        0.2 * island.fbm(result9 * 0.017 + 3, result10 * 0.017 - 2, 3) +
        0.45 *
          smoothTerrainScalar(
            20,
            4,
            Math.min(result9 + 64, result10 + 64, 64 - result9, 64 - result10),
          );
      let hypotResult2 = Math.hypot(result9 * 0.9, result10);
      let result14 = Math.max(
        smoothTerrainScalar(27, 15, hypotResult2),
        smoothTerrainScalar(0.72, 0.95, result13),
        smoothTerrainScalar(
          terrainState.terrainHillLandmark.r + 6,
          terrainState.terrainHillLandmark.r,
          Math.hypot(
            result9 - terrainState.terrainHillLandmark.x,
            result10 - terrainState.terrainHillLandmark.z,
          ),
        ),
      );
      let result15 =
        island.fbm(result11 * 0.016 + 11, result12 * 0.016 - 3, 3) +
        0.05 * island.noise(result9 * 0.09, result10 * 0.09) -
        1.3 * result14;
      let result16 =
        3 * callback4(0.08, result15) +
        3 * callback4(0.26, result15) +
        4 * callback4(0.44, result15);
      let smoothTerrainScalarResult2 = smoothTerrainScalar(
        6,
        -44,
        result9 * 0.55 + result10 * 0.85,
      );
      let result17 =
        island.fbm(result11 * 0.028 + 1.7, result12 * 0.028 - 4.1, 3) * 0.75 +
        (smoothTerrainScalarResult2 - 0.55) * 1.1 +
        0.04 * island.noise(result9 * 0.11, result10 * 0.11) -
        1.6 * result14;
      result16 = Math.max(
        result16,
        4 * callback4(-0.02, result17) +
          4 * callback4(0.16, result17) +
          5 * callback4(0.32, result17) +
          5 * callback4(0.48, result17) +
          4 * callback4(0.62, result17),
      );
      result8 += result16;
      result8 = interpolateTerrainScalar(
        result8,
        Math.min(result8, 9.2 + 0.5 * island.fbm(result * 0.09, result2 * 0.09, 2)),
        smoothTerrainScalar(16, 10, hypotResult),
      );
      let result18 =
        result -
        terrainState.terrainHillLandmark.x +
        2.5 * island.fbm(result * 0.06 + 4, result2 * 0.06, 2);
      let result19 =
        (result2 - terrainState.terrainHillLandmark.z) * 1.15 +
        2.5 * island.fbm(result * 0.06, result2 * 0.06 + 9, 2);
      let result20 =
        1 -
        Math.hypot(result18, result19) / terrainState.terrainHillLandmark.r +
        0.12 * island.fbm(result * 0.1 + 2, result2 * 0.1, 2);
      let callback5 = (value4) => smoothTerrainScalar(value4 - 0.02, value4 + 0.02, result20);
      result8 += 2 * callback5(0.12) + 1 * callback5(0.4) + 2 * callback5(0.66);
      let result21 = 1.6 * island.fbm(result * 0.12 + 7, result2 * 0.12, 2);
      let result22 = (Math.hypot(result - 47, (result2 - 45) * 1.2) + result21) / 8.5;
      let result23 = (Math.hypot(result + 53, result2 - 24) + result21) / 6.5;
      let result24 = Math.max(
        smoothTerrainScalar(1, 0.25, result22) * 8.2,
        smoothTerrainScalar(1, 0.3, result23) * 7,
      );
      let result25 =
        4.3 +
        1.2 * island.fbm(result * 0.05, result2 * 0.05, 2) +
        1 * island.fbm(result * 0.19 + 3, result2 * 0.19, 2) -
        5 * smoothTerrainScalar(0.9, 1.08, result6);
      if (result7 < 6) {
        result25 = interpolateTerrainScalar(1, result25, result7 / 6);
      }
      result8 = interpolateTerrainScalar(result25, result8, smoothTerrainScalarResult);
      if (result24 > 0) {
        result8 = Math.max(result8, Math.max(result25, 3.4) + result24);
      }
      if (result7 < 6) {
        result8 = Math.min(result8, interpolateTerrainScalar(1, Math.max(result8, 1), result7 / 6));
      }
      let result26 =
        terrainState.terrainPondLandmark.r + 1.3 * island.fbm(result * 0.11 + 9, result2 * 0.11, 2);
      let result27 =
        Math.hypot(
          result - terrainState.terrainPondLandmark.x,
          result2 - terrainState.terrainPondLandmark.z,
        ) / result26;
      if (result27 < 1) {
        result8 = Math.min(
          result8,
          interpolateTerrainScalar(4.6, 7, smoothTerrainScalar(0.25, 1, result27)),
        );
        island.flags[result3] |= 1;
      } else {
        if (result27 < 1.45) {
          result8 = Math.min(result8, 8.2);
          island.flags[result3] |= 4;
        } else {
          if (result27 < 1.9) {
            result8 = Math.min(
              result8,
              interpolateTerrainScalar(8.4, result8, smoothTerrainScalar(1.45, 1.9, result27)),
            );
          }
        }
      }
      let measurePolylineDistanceResult = measurePolylineDistance(
        result + 1.2 * island.noise(result * 0.15, result2 * 0.15),
        result2,
        terrainState.terrainRiverWaypoints,
      );
      let result28 =
        2 +
        0.6 * island.fbm(measurePolylineDistanceResult.t * 0.08, 3.3, 2) +
        Math.min(1.5, measurePolylineDistanceResult.t * 0.02);
      if (measurePolylineDistanceResult.d < result28) {
        result8 = Math.min(
          result8,
          interpolateTerrainScalar(
            5.2,
            7,
            smoothTerrainScalar(result28 * 0.3, result28, measurePolylineDistanceResult.d),
          ),
        );
        island.flags[result3] |= 2;
      } else {
        if (measurePolylineDistanceResult.d < result28 + 1.4) {
          result8 = Math.min(result8, 8.2);
          island.flags[result3] |= 4;
        } else {
          if (measurePolylineDistanceResult.d < result28 + 3.2) {
            result8 = Math.min(
              result8,
              interpolateTerrainScalar(
                8.4,
                result8,
                smoothTerrainScalar(
                  result28 + 1.4,
                  result28 + 3.2,
                  measurePolylineDistanceResult.d,
                ),
              ),
            );
          }
        }
      }
      island.smoothHeights[result3] = result8;
    }
  }
}
