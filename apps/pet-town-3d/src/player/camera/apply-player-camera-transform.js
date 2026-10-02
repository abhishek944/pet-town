import { playerState } from "../state.js";
import { clampPlayerCameraValue } from "./clamp-player-camera-value.js";
import { dampPlayerCameraValue } from "./damp-player-camera-value.js";
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
  camera.position
    .copy(focus)
    .addScaledVector(playerState.playerCameraOffsetDirection, renderDistance);
  let groundBelowResult = world.groundBelow(
    camera.position.x,
    camera.position.y + 1.2,
    camera.position.z,
    8,
    true,
  );
  if (isFinite(groundBelowResult) && camera.position.y < groundBelowResult + 0.4) {
    camera.position.y = groundBelowResult + 0.4;
  }
  let waterLevel2 = world.waterLevel;
  if (isFinite(waterLevel2) && focus.y > waterLevel2 && camera.position.y < waterLevel2 + 0.3) {
    camera.position.y = waterLevel2 + 0.3;
  }
  let result13 = Math.sin(frame.stepPhase * 2) * 0.03 * frame.runAmt * !!frame.onGround;
  camera.position.y += result13 + this.dip;
  this.lookAt.set(lookX, lookY + this.dip * 0.5, lookZ);
  camera.lookAt(this.lookAt);
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
  let result14 = this.baseFov * (1 + frame.runAmt * 0.14 + (frame.gliding ? 0.1 : 0));
  this.fov = deltaTime > 0 ? dampPlayerCameraValue(this.fov, result14, 4, deltaTime) : result14;
  if (Math.abs(camera.fov - this.fov) > 0.001) {
    camera.fov = this.fov;
    camera.updateProjectionMatrix();
  }
}
