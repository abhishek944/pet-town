import { wrapPlayerCameraAngle } from "./wrap-player-camera-angle.js";
import { dampPlayerCameraValue } from "./damp-player-camera-value.js";
import { stepPlayerCameraCriticalSpring } from "./step-player-camera-critical-spring.js";
import { getPlayerCameraHeightTarget } from "./get-player-camera-height-target.js";
export function updatePlayerCameraFollow(deltaTime, frame) {
  if (deltaTime > 0 && frame.moving && this.idleInput > 1.2 && !frame.swimming) {
    let hypotResult = Math.hypot(frame.vel.x, frame.vel.z);
    if (hypotResult > 0.5) {
      let atan2Result = Math.atan2(-frame.vel.x, -frame.vel.z);
      let result15 = Math.sin(wrapPlayerCameraAngle(atan2Result - this.yawT));
      this.yawT += result15 * this.autoFollow * Math.min(1, hypotResult / 6) * deltaTime;
    }
  }
  this.yaw = dampPlayerCameraValue(this.yaw, this.yawT, 16, deltaTime);
  this.pitch = dampPlayerCameraValue(this.pitch, this.pitchT, 16, deltaTime);
  this.dist = dampPlayerCameraValue(this.dist, this.distT, 9, deltaTime);
  let targetX = frame.pos.x + frame.vel.x * 0.14;
  let targetZ = frame.pos.z + frame.vel.z * 0.14;
  const targetY = getPlayerCameraHeightTarget.call(this, frame, deltaTime);
  if (deltaTime > 0) {
    [this.focus.x, this.fvel.x] = stepPlayerCameraCriticalSpring(
      this.focus.x,
      this.fvel.x,
      targetX,
      10,
      deltaTime,
    );
    [this.focus.z, this.fvel.z] = stepPlayerCameraCriticalSpring(
      this.focus.z,
      this.fvel.z,
      targetZ,
      10,
      deltaTime,
    );
    const [height, speed] = stepPlayerCameraCriticalSpring(
      this.focus.y,
      this.fvel.y,
      targetY,
      frame.swimming || frame.gliding ? 5 : 6,
      deltaTime,
    );
    const travel = Math.max(-3 * deltaTime, Math.min(3 * deltaTime, height - this.focus.y));
    this.fvel.y = Math.abs(travel - (height - this.focus.y)) > 1e-6 ? travel / deltaTime : speed;
    this.focus.y += travel;
    let result18 = frame.pos.x - this.focus.x;
    let result19 = frame.pos.z - this.focus.z;
    let hypotResult2 = Math.hypot(result18, result19);
    if (hypotResult2 > 2.2) {
      let result20 = (hypotResult2 - 2.2) / hypotResult2;
      this.focus.x += result18 * result20;
      this.focus.z += result19 * result20;
    }
  }
}
