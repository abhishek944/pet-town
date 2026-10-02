import { clampPlayerAnimationValue } from "../animation-math/clamp-player-animation-value.js";
import { dampPlayerAnimationValue } from "../animation-math/damp-player-animation-value.js";
export function applyPlayerBodyPose(
  deltaTime,
  frame,
  glideWeight,
  groundWeight,
  runWeight,
  moveWeight,
  phase,
  time,
  swimWeight,
  acceleration,
  pose,
) {
  let squashAmount = this.sq.update(0, deltaTime);
  let result11 =
    frame.onGround || frame.swimming
      ? 0
      : clampPlayerAnimationValue(frame.vy * 0.0125, -0.07, 0.12) * (1 - glideWeight);
  let result12 = groundWeight * runWeight * moveWeight * 0.04 * Math.cos(2 * phase);
  let clampPlayerAnimationValueResult = clampPlayerAnimationValue(
    1 + squashAmount + result11 + result12,
    0.7,
    1.35,
  );
  let result13 = 1 / Math.sqrt(clampPlayerAnimationValueResult);
  this.squash.scale.set(result13, clampPlayerAnimationValueResult, result13);
  let result14 = Math.sin(time * 2.3) * (0.018 + 0.01 * (1 - moveWeight)) * (1 - swimWeight * 0.5);
  this.breath.scale.set(1 - result14 * 0.5, 1 + result14, 1 - result14 * 0.5);
  this.accS = dampPlayerAnimationValue(this.accS, deltaTime > 0 ? acceleration : 0, 14, deltaTime);
  pose.nx += this.neckS.update(
    clampPlayerAnimationValue(-this.accS * 0.014, -0.3, 0.3) * (groundWeight + 0.4 * swimWeight),
    deltaTime,
  );
  this.hips.position.y = 0.34 + pose.hy;
  this.hips.rotation.set(pose.hx, pose.hry, pose.hz);
  this.torso.rotation.set(pose.tx, pose.ty, 0);
  this.neck.rotation.set(pose.nx, pose.ny, pose.nz);
  this.armL.rotation.set(pose.alx, 0, pose.alz);
  this.armR.rotation.set(pose.arx, 0, pose.arz);
  this.legL.rotation.set(pose.llx, 0, pose.llz + 0.04);
  this.legR.rotation.set(pose.lrx, 0, pose.lrz - 0.04);
  this.legL.position.y = 0.02 + pose.fl;
  this.legR.position.y = 0.02 + pose.fr;
  this.knees[1].rotation.x = Math.max(0, pose.kl);
  this.knees[0].rotation.x = Math.max(0, pose.kr);
  this.elbows[1].rotation.x = Math.min(0, pose.el);
  this.elbows[0].rotation.x = Math.min(0, pose.er);
  this.feet[1].rotation.x = pose.fpl;
  this.feet[0].rotation.x = pose.fpr;
  this.root.userData.swimLift = pose.rootY;
  return {
    squashAmount,
  };
}
