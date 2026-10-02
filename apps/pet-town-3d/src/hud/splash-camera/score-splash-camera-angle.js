/** Obstacle-aware opening camera orbit and transition back to gameplay. */
import { hudState } from "../state.js";
export function scoreSplashCameraAngle(playerPosition, angle, obstacles) {
  let terrain2 = hudState.hudContext.terrain;
  let x2 = playerPosition.x;
  let result = playerPosition.y + 1.2 + hudState.splashCameraSettings.look - 1.2;
  let z2 = playerPosition.z;
  let result2 = x2 + Math.sin(angle) * hudState.splashCameraSettings.r;
  let result3 = playerPosition.y + 1.2 + hudState.splashCameraSettings.h;
  let result4 = z2 + Math.cos(angle) * hudState.splashCameraSettings.r;
  let index = 0;
  for (let result5 = 3; result5 <= 20; result5++) {
    let result6 = result5 / 20;
    let result7 = x2 + (result2 - x2) * result6;
    let result8 = result + (result3 - result) * result6;
    let result9 = z2 + (result4 - z2) * result6;
    let result10 = result6 > 0.75 ? 3 : 1;
    try {
      let result11 = terrain2?.topY?.(result7, result9);
      if (Number.isFinite(result11) && result8 < result11 + 1.5) {
        index += 2;
      }
    } catch {}
    for (let position2 of obstacles) {
      if (
        result8 < position2.top + result10 &&
        Math.hypot(result7 - position2.x, result9 - position2.z) < position2.r + result10
      ) {
        index += result6 > 0.75 ? 3 : 1;
      }
    }
  }
  for (let position3 of obstacles) {
    if (position3.big) {
      let hypotResult = Math.hypot(result2 - position3.x, result4 - position3.z);
      if (hypotResult < 16) {
        index += (16 - hypotResult) * 0.8;
      }
    }
  }
  return index;
}
