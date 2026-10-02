/** Obstacle-aware opening camera orbit and transition back to gameplay. */
import { collectSplashCameraObstacles } from "./collect-splash-camera-obstacles.js";
import { scoreSplashCameraAngle } from "./score-splash-camera-angle.js";
import { hudState } from "../state.js";
export function chooseSplashCameraAngle(position, preferredAngle) {
  let collectSplashCameraObstaclesResult = collectSplashCameraObstacles(position);
  let value2Value = preferredAngle;
  let result = 1 / 0;
  for (let result2 = -16; result2 <= 16; result2++) {
    let result3 = preferredAngle + (result2 * Math.PI) / 24;
    let result4 = Math.abs(result2) * 0.35;
    for (let result5 of [-1, -0.5, 0, 0.5, 1]) {
      result4 += scoreSplashCameraAngle(
        position,
        result3 + result5 * hudState.splashCameraSettings.sway,
        collectSplashCameraObstaclesResult,
      );
    }
    if (result4 < result) {
      result = result4;
      value2Value = result3;
    }
  }
  return value2Value;
}
