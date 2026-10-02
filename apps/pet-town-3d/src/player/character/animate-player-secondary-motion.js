import { clampPlayerAnimationValue } from "../animation-math/clamp-player-animation-value.js";
import { dampPlayerAnimationValue } from "../animation-math/damp-player-animation-value.js";
export function animatePlayerSecondaryMotion(
  deltaTime,
  glideWeight,
  airWeight,
  frame,
  time,
  runWeight,
  moveWeight,
  swimWeight,
) {
  let result17 = this.hips.position.y + this.root.position.y;
  let result18 = deltaTime > 0 ? (result17 - this.prevHeadY) / deltaTime : 0;
  this.prevHeadY = result17;
  this.headVy = dampPlayerAnimationValue(
    this.headVy,
    clampPlayerAnimationValue(result18, -20, 20),
    20,
    deltaTime,
  );
  let result19 = glideWeight ? 0.25 : 0;
  for (let index4 = 0; index4 < 2; index4++) {
    let result50 = index4 === 0 ? -1 : 1;
    let updateResult2 = this.earS[index4].update(
      clampPlayerAnimationValue(this.headVy * 0.035, -0.5, 0.6) + result19 + airWeight * 0.2,
      deltaTime,
    );
    this.ears[index4].rotation.x = -0.12 - updateResult2 * 0.9;
    this.ears[index4].rotation.z =
      -result50 * (0.25 + clampPlayerAnimationValue(updateResult2, -0.3, 0.4) * 0.4) +
      this.earSide.x * 0.3;
  }
  this.earSide.update(clampPlayerAnimationValue(-this.turnRate * 0.05, -0.5, 0.5), deltaTime);
  if (this.sprout) {
    this.sprout.rotation.x = this.sproutS.update(
      clampPlayerAnimationValue(-this.headVy * 0.02, -0.25, 0.25) -
        clampPlayerAnimationValue(frame.speed * 0.02, 0, 0.12),
      deltaTime,
    );
    this.sprout.rotation.z = this.sproutZ.update(
      clampPlayerAnimationValue(this.turnRate * 0.025, -0.2, 0.2),
      deltaTime,
    );
  }
  let result20 =
    Math.sin(time * (this.idleT > 1 ? 7 : 11)) *
    (0.18 + 0.3 * runWeight * moveWeight + 0.25 * this.happy);
  this.happy = dampPlayerAnimationValue(this.happy, 0, 1.5, deltaTime);
  let result21 =
    this.tailS.update(clampPlayerAnimationValue(-this.turnRate * 0.08, -0.7, 0.7), deltaTime) +
    result20 * 0.6;
  this.tail.rotation.y = result21;
  this.tail.rotation.x = this.tailP.update(
    0.35 +
      0.12 * runWeight * moveWeight -
      0.3 * swimWeight +
      0.3 * airWeight * clampPlayerAnimationValue(-frame.vy / 10, -1, 1),
    deltaTime,
  );
  this.tail2.rotation.y = this.tail2S.update(result21 * 0.9, deltaTime) - result21 * 0.25;
  this.tail2.rotation.x = 0.25 - 0.12 * runWeight * moveWeight + 0.08 * Math.sin(time * 2.3);
  let clampPlayerAnimationValueResult2 = clampPlayerAnimationValue(
    frame.speed * 0.13 + Math.max(0, -frame.vy) * 0.06 + glideWeight * 0.6,
    0,
    1.45,
  );
  let result22 =
    Math.sin(time * 15) * 0.1 * clampPlayerAnimationValue(frame.speed / 6, 0, 1) +
    Math.sin(time * 2.1) * 0.04;
  this.scarf1.rotation.x =
    -this.scarfS.update(clampPlayerAnimationValueResult2, deltaTime) + result22;
  this.scarf1.rotation.z = -0.25 + this.bank * 0.5;
  this.scarf2.rotation.x =
    -this.scarfS2.update(clampPlayerAnimationValueResult2 * 0.5, deltaTime) * 0.7 +
    Math.sin(time * 15 + 1.2) * 0.14 * clampPlayerAnimationValue(frame.speed / 6, 0, 1);
}
