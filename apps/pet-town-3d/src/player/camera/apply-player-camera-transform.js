import { playerState } from "../state.js";
import { clampPlayerCameraValue } from "./clamp-player-camera-value.js";
import { dampPlayerCameraValue } from "./damp-player-camera-value.js";
import { getPlayerCameraRadius } from "./get-player-camera-radius.js";
import { validatePlayerCameraPose } from "./validate-player-camera-pose.js";
import { framePlayerCameraSubject } from "./frame-player-camera-subject.js";
import { frameUnderwaterCamera } from "../../water/swimming/frame-underwater-camera.js";
export function applyPlayerCameraTransform(
  camera,
  focus,
  renderDistance,
  world,
  frame,
  lookX,
  lookY,
  lookZ,
  deltaTime,
) {
  const targetFov = this.baseFov;
  this.fov = deltaTime > 0 ? dampPlayerCameraValue(this.fov, targetFov, 4, deltaTime) : targetFov;
  if (Math.abs(camera.fov - this.fov) > 0.001) {
    camera.fov = this.fov;
    camera.updateProjectionMatrix();
  }
  const clearance = getPlayerCameraRadius(camera) + 0.05;
  const desired = focus
    .clone()
    .copy(focus)
    .addScaledVector(playerState.playerCameraOffsetDirection, renderDistance);
  let groundBelowResult = world.groundBelow(desired.x, desired.y + 1.2, desired.z, 8, true);
  if (isFinite(groundBelowResult) && desired.y < groundBelowResult + clearance) {
    desired.y = groundBelowResult + clearance;
  }
  let waterLevel2 = world.waterLevel;
  if (isFinite(waterLevel2) && focus.y > waterLevel2 && desired.y < waterLevel2 + clearance) {
    desired.y = waterLevel2 + clearance;
  }
  frameUnderwaterCamera(this.ctx, frame, focus, desired, clearance);
  if (!validatePlayerCameraPose.call(this, focus, desired, frame, deltaTime)) return;
  this.lookAt.set(lookX, lookY, lookZ);
  framePlayerCameraSubject.call(this, frame, focus, deltaTime);
  let distanceToResult = camera.position.distanceTo(focus);
  this.fade =
    deltaTime > 0
      ? dampPlayerCameraValue(
          this.fade,
          clampPlayerCameraValue((distanceToResult - 0.55) / 0.85, 0, 1),
          12,
          deltaTime,
        )
      : clampPlayerCameraValue((distanceToResult - 0.55) / 0.85, 0, 1);
}
