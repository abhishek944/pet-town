/** Water lifecycle, terrain rebaking, dynamic reflections/refraction, ripples, splashes, and public water API. */

import { waterState } from "../state.js";
export function updateWaterDebug(frame) {
  if (
    waterState.waterRuntimeState.debugRipples &&
    frame.time - waterState.waterRuntimeState.debugRippleT > 0.45
  ) {
    waterState.waterRuntimeState.debugRippleT = frame.time;
    let camera3 = frame.context.camera;
    let worldDirectionResult = camera3.getWorldDirection(waterState.waterRuntimeState.tmpA);
    let result13 =
      worldDirectionResult.y < -0.05
        ? (waterState.waterRuntimeState.surfaceY - camera3.position.y) / worldDirectionResult.y
        : 20;
    let result14 = camera3.position.x + worldDirectionResult.x * result13;
    let result15 = camera3.position.z + worldDirectionResult.z * result13;
    for (let index = 0; index < 16; index++) {
      let result16 = result14 + (Math.random() - 0.5) * 16;
      let result17 = result15 + (Math.random() - 0.5) * 16;
      if (waterState.waterRuntimeState.isWater(result16, result17)) {
        if (Math.random() < 0.3) {
          waterState.waterRuntimeState.splash(
            {
              x: result16,
              z: result17,
            },
            1,
          );
        } else {
          waterState.waterRuntimeState.ripple(result16, result17, 1);
        }
        break;
      }
    }
  }
  waterState.waterRuntimeState.applyDebugCam();
}
