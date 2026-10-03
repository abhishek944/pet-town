import { Quaternion, Vector3 } from "three";
import { getPlayerCameraFrameLimits } from "./get-player-camera-frame-limits.js";
import { stepPlayerCameraCriticalSpring } from "./step-player-camera-critical-spring.js";

/** Frame a stable body point without snapping the horizon at screen edges. */
export function framePlayerCameraSubject(frame, focus, deltaTime) {
  const camera = this.cam;
  const height = this.subjectHeight;
  const head =
    frame.head?.clone() ?? new Vector3(frame.pos.x, frame.pos.y + height * 0.82, frame.pos.z);
  if (!this.intro) this.lookAt.y = focus.y - 1.05 + height * 0.75;
  camera.lookAt(this.lookAt);
  if (this.intro) return;
  camera.updateMatrixWorld();
  const forward = camera.getWorldDirection(new Vector3());
  if (head.clone().sub(camera.position).dot(forward) <= camera.near) {
    // A genuinely invalid view still needs an immediate safety correction.
    this.lookAt.copy(head);
    camera.lookAt(head);
    this.aimCorrection = this.aimVelocity = 0;
    return;
  }
  const base = camera.quaternion.clone();
  const right = new Vector3(1, 0, 0).applyQuaternion(base);
  const subject = new Vector3(frame.pos.x, frame.pos.y + height * 0.82, frame.pos.z);
  const baseY = subject.clone().project(camera).y;
  const { top, bottom } = getPlayerCameraFrameLimits(this.ctx);
  const tangent = Math.tan((camera.fov * Math.PI) / 360);
  const boundedY = Math.max(bottom, Math.min(top, baseY));
  // Project from the uncorrected body reference. Animated head poses and
  // grounded/airborne switches must not change the framing controller.
  const target = Math.atan(baseY * tangent) - Math.atan(boundedY * tangent);
  const dt = Math.max(0, deltaTime);
  if (dt > 0) {
    const [angle, velocity] = stepPlayerCameraCriticalSpring(
      this.aimCorrection,
      this.aimVelocity ?? 0,
      target,
      6,
      dt,
    );
    const limit = (Math.PI / 18) * dt;
    const change = Math.max(-limit, Math.min(limit, angle - this.aimCorrection));
    this.aimVelocity =
      Math.abs(change - (angle - this.aimCorrection)) > 1e-6 ? change / dt : velocity;
    this.aimCorrection += change;
  } else {
    this.aimCorrection = target;
    this.aimVelocity = 0;
  }
  // Screen composition is a comfort target, not solid collision safety.
  // Never bypass the angular spring simply because a jump reaches an edge.
  camera.quaternion
    .copy(base)
    .premultiply(new Quaternion().setFromAxisAngle(right, this.aimCorrection));
  camera.getWorldDirection(forward);
  this.lookAt
    .copy(camera.position)
    .addScaledVector(forward, Math.max(camera.position.distanceTo(focus), 1));
}
