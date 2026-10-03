import { PerspectiveCamera, Vector3 } from "three";
import { getPlayerCameraFrameLimits } from "./get-player-camera-frame-limits.js";

/** Let jumps travel within the frame before moving the camera's height. */
export function getPlayerCameraHeightTarget(frame, deltaTime) {
  const jumping = !frame.onGround && !frame.swimming && !frame.gliding;
  if (!jumping || this.intro || deltaTime <= 0) {
    this.airCameraHeight = null;
    return frame.pos.y + 1.05 + (frame.swimming ? 0.25 : frame.gliding ? -0.4 : 0);
  }
  this.airCameraHeight ??= this.focus.y;
  const height = this.subjectHeight;
  const reference = (this.heightCamera ??= new PerspectiveCamera());
  reference.fov = this.cam.fov;
  reference.aspect = this.cam.aspect;
  reference.near = this.cam.near;
  reference.updateProjectionMatrix();
  const focus = new Vector3(this.focus.x, this.airCameraHeight, this.focus.z);
  const pitch = this.pitch + this.assist;
  const direction = new Vector3(
    Math.sin(this.yaw) * Math.cos(pitch),
    Math.sin(pitch),
    Math.cos(this.yaw) * Math.cos(pitch),
  );
  reference.position.copy(focus).addScaledVector(direction, this.curDist);
  const aim = focus.clone().setY(focus.y - 1.05 + height * 0.75);
  const ahead = this.frameAhead * this.curDist * Math.max(0, Math.cos(pitch) - 0.2);
  aim.x -= Math.sin(this.yaw) * ahead;
  aim.z -= Math.cos(this.yaw) * ahead;
  reference.lookAt(aim);
  reference.updateMatrixWorld();
  const body = new Vector3(frame.pos.x, frame.pos.y + height * 0.55, frame.pos.z);
  const projected = body.clone().project(reference);
  const head = body
    .clone()
    .setY(frame.pos.y + height * 0.82)
    .project(reference);
  const foot = frame.pos.clone().project(reference);
  const { top, bottom } = getPlayerCameraFrameLimits(this.ctx);
  const tooTall = head.y - foot.y > top - bottom;
  const trackedY = tooTall ? head.y : projected.y;
  const lower = tooTall ? bottom : bottom + projected.y - foot.y;
  const upper = tooTall ? top : top - head.y + projected.y;
  const limited = Math.max(lower, Math.min(upper, trackedY));
  const error = trackedY - limited;
  const forward = reference.getWorldDirection(new Vector3());
  const depth = body.clone().sub(reference.position).dot(forward);
  const up = new Vector3(0, 1, 0).applyQuaternion(reference.quaternion);
  if (depth > reference.near && Number.isFinite(error) && up.y > 0.1) {
    const correction = (error * depth * Math.tan((reference.fov * Math.PI) / 360)) / up.y;
    // A target outside the zone changes the held height; returning inside
    // does not recenter it every frame. Ground contact releases this hold.
    this.airCameraHeight += Math.max(-1, Math.min(1, correction));
  }
  return this.airCameraHeight;
}
