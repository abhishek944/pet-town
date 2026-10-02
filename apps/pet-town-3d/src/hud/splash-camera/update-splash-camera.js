/** Obstacle-aware opening camera orbit and transition back to gameplay. */
import { hudState } from "../state.js";
import { chooseSplashCameraAngle } from "./choose-splash-camera-angle.js";
import { interpolateSplashAngle } from "./interpolate-splash-angle.js";
export function updateSplashCamera(deltaTime) {
  let camera2 = hudState.hudContext.camera;
  let player2 = hudState.hudContext.player;
  let position2 = player2?.position;
  if (!camera2 || !position2 || player2.camera?.frozen) {
    return;
  }
  if (hudState.hudRuntime.splash && hudState.hudElements.splash?.classList.contains(`ready`)) {
    hudState.hudRuntime.orbitA ??
      ((hudState.hudRuntime.orbitA0 = chooseSplashCameraAngle(
        position2,
        Math.atan2(camera2.position.x - position2.x, camera2.position.z - position2.z),
      )),
      (hudState.hudRuntime.orbitT = 0),
      hudState.hudElements.splash.classList.add(`live`));
    hudState.hudRuntime.orbitT += deltaTime;
    hudState.hudRuntime.orbitA =
      hudState.hudRuntime.orbitA0 +
      hudState.splashCameraSettings.sway * Math.sin(hudState.hudRuntime.orbitT * 0.11);
    camera2.position.set(
      position2.x + Math.sin(hudState.hudRuntime.orbitA) * hudState.splashCameraSettings.r,
      position2.y + 1.2 + hudState.splashCameraSettings.h,
      position2.z + Math.cos(hudState.hudRuntime.orbitA) * hudState.splashCameraSettings.r,
    );
    camera2.lookAt(position2.x, position2.y + hudState.splashCameraSettings.look, position2.z);
    camera2.updateMatrixWorld();
    return;
  }
  let blend2 = hudState.hudRuntime.blend;
  if (!blend2) {
    return;
  }
  let copy = camera2.position.clone();
  let copy2 = camera2.quaternion.clone();
  let atan2Result = Math.atan2(copy.x - position2.x, copy.z - position2.z);
  let hypotResult = Math.hypot(copy.x - position2.x, copy.z - position2.z);
  let result = copy.y - position2.y;
  blend2.t = Math.min(1, blend2.t + deltaTime / 1.9);
  let t2 = blend2.t;
  let result2 = t2 < 0.5 ? 4 * t2 * t2 * t2 : 1 - (-2 * t2 + 2) ** 3 / 2;
  let interpolateSplashAngleResult = interpolateSplashAngle(blend2.a, atan2Result, result2);
  let result3 = blend2.r + (hypotResult - blend2.r) * result2;
  let result4 = blend2.h + (result - blend2.h) * result2;
  camera2.position.set(
    position2.x + Math.sin(interpolateSplashAngleResult) * result3,
    position2.y + result4,
    position2.z + Math.cos(interpolateSplashAngleResult) * result3,
  );
  camera2.lookAt(position2.x, position2.y + hudState.splashCameraSettings.look, position2.z);
  let copy3 = camera2.quaternion.clone();
  camera2.quaternion.slerpQuaternions(copy3, copy2, result2 * result2);
  camera2.updateMatrixWorld();
  if (blend2.t >= 1) {
    hudState.hudRuntime.blend = null;
  }
}
