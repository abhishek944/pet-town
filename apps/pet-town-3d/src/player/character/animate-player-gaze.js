import { clampPlayerAnimationValue } from "../animation-math/clamp-player-animation-value.js";
import { dampPlayerAnimationValue } from "../animation-math/damp-player-animation-value.js";
import { wrapPlayerAnimationAngle } from "../animation-math/wrap-player-animation-angle.js";
export function animatePlayerGaze(frame, moveWeight, deltaTime, pose) {
  let targetLookYaw = 0;
  let targetLookPitch = 0;
  let look2 = frame.look;
  if (((this.idleT = moveWeight < 0.2 && frame.onGround ? this.idleT + deltaTime : 0), look2)) {
    let result42 = look2.x - frame.pos.x;
    let result43 = look2.z - frame.pos.z;
    let result44 = look2.y - (frame.pos.y + 1.05);
    targetLookYaw = wrapPlayerAnimationAngle(Math.atan2(result42, result43) - frame.facing);
    targetLookPitch = Math.atan2(result44, Math.hypot(result42, result43));
    if (Math.abs(targetLookYaw) > 1.5) {
      targetLookYaw = 0;
      targetLookPitch = 0;
    }
  } else if (this.idleT > 2.5) {
    if (((this.glanceT -= deltaTime), this.glanceT <= 0)) {
      this.glanceT = 1.6 + Math.random() * 2.8;
      let result45 = frame.camPos
        ? wrapPlayerAnimationAngle(
            Math.atan2(frame.camPos.x - frame.pos.x, frame.camPos.z - frame.pos.z) - frame.facing,
          )
        : 0;
      let result46 = Math.random();
      if (result46 < 0.35 && Math.abs(result45) < 1.6) {
        this.glanceYaw = result45;
        this.glancePitch = 0.12;
      } else {
        if (result46 < 0.8) {
          this.glanceYaw = (Math.random() - 0.5) * 1.3;
          this.glancePitch = (Math.random() - 0.3) * 0.35;
        } else {
          this.glanceYaw = 0;
          this.glancePitch = 0;
        }
      }
    }
    targetLookYaw = this.glanceYaw;
    targetLookPitch = this.glancePitch;
  } else {
    if (frame.turnAhead) {
      targetLookYaw = clampPlayerAnimationValue(frame.turnAhead, -0.9, 0.9);
    }
  }
  this.lookYaw = dampPlayerAnimationValue(
    this.lookYaw,
    clampPlayerAnimationValue(targetLookYaw, -0.95, 0.95),
    7,
    deltaTime,
  );
  this.lookPitch = dampPlayerAnimationValue(
    this.lookPitch,
    clampPlayerAnimationValue(targetLookPitch, -0.45, 0.4),
    7,
    deltaTime,
  );
  pose.ny += this.lookYaw * 0.75;
  pose.hry += this.lookYaw * 0.2;
  pose.nx -= this.lookPitch;
  pose.nz += this.lookYaw * -0.06;
}
