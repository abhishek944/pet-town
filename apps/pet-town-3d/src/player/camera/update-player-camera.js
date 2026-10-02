import { updatePlayerCameraFollow } from "./update-player-camera-follow.js";
import { resolvePlayerCameraObstruction } from "./resolve-player-camera-obstruction.js";
import { framePlayerCameraIntro } from "./frame-player-camera-intro.js";
import { applyPlayerCameraTransform } from "./apply-player-camera-transform.js";
export function updatePlayerCamera(deltaTime, frame) {
  if (this.frozen) {
    return;
  }
  let camera = this.cam;
  let world = this.world;
  updatePlayerCameraFollow.call(this, deltaTime, frame);
  let focus, assistedPitch;
  ({ focus, assistedPitch } = resolvePlayerCameraObstruction.call(this, world, deltaTime));
  let renderDistance, lookX, lookY, lookZ;
  ({ renderDistance, lookX, lookY, lookZ } = framePlayerCameraIntro.call(
    this,
    assistedPitch,
    focus,
    deltaTime,
  ));
  applyPlayerCameraTransform.call(
    this,
    camera,
    focus,
    renderDistance,
    world,
    frame,
    lookX,
    lookY,
    lookZ,
    deltaTime,
  );
}
