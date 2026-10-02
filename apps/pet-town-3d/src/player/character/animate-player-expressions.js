import { lerpPlayerAnimationValue } from "../animation-math/lerp-player-animation-value.js";
import { clampPlayerAnimationValue } from "../animation-math/clamp-player-animation-value.js";
import { dampPlayerAnimationValue } from "../animation-math/damp-player-animation-value.js";
export function animatePlayerExpressions(
  deltaTime,
  frame,
  squashAmount,
  stretchAmount,
  moveWeight,
  glideWeight,
  airWeight,
  pose,
) {
  this.blinkT -= deltaTime;
  if (this.blinkT <= 0 && !frame.onGround && !frame.swimming) {
    this.blinkT = 0.25;
  }
  if (this.blinkT <= 0) {
    this.blink = 0.13;
    if (this.doubleBlink) {
      this.doubleBlink = false;
      this.blinkT = 0.22;
    } else {
      this.doubleBlink = Math.random() < 0.22;
      this.blinkT = this.doubleBlink ? 0.22 : 1.8 + Math.random() * 3.2;
    }
  }
  this.blink = Math.max(0, this.blink - deltaTime);
  let result23 = this.blink > 0 ? Math.sin((this.blink / 0.13) * Math.PI) : 0;
  let clampPlayerAnimationValueResult3 = clampPlayerAnimationValue(-squashAmount * 2.2, 0, 0.6);
  let clampPlayerAnimationValueResult4 = clampPlayerAnimationValue(
    Math.max(
      result23,
      clampPlayerAnimationValueResult3 * 0.75,
      stretchAmount,
      (frame.onGround ? 0.1 : 0) + 0.1 * (1 - moveWeight) * (this.idleT > 4),
    ),
    0,
    1,
  );
  if (glideWeight > 0.5) {
    this.happyEyes = Math.max(this.happyEyes, 1);
  }
  this.lidAmt =
    result23 > 0.05
      ? clampPlayerAnimationValueResult4
      : dampPlayerAnimationValue(this.lidAmt, clampPlayerAnimationValueResult4, 18, deltaTime);
  this.happyEyes = dampPlayerAnimationValue(this.happyEyes, 0, 2.5, deltaTime);
  let result24 = this.happyEyes > 0.5 && this.lidAmt < 0.5;
  for (let result51 of this.eyes) {
    result51.lid.rotation.x = lerpPlayerAnimationValue(-1.78, 1.62, this.lidAmt);
    result51.open.visible = !result24 && this.lidAmt < 0.97;
    result51.hi.visible = this.lidAmt < 0.3;
    result51.shut.visible = !result24 && this.lidAmt >= 0.9;
    result51.happy.visible = result24;
    result51.lid.visible = !result24;
  }
  this.raise = dampPlayerAnimationValue(
    this.raise,
    clampPlayerAnimationValue(this.happy * 0.6 + airWeight * Math.max(0, frame.vy / 9), 0, 1),
    6,
    deltaTime,
  );
  this.knit = dampPlayerAnimationValue(
    this.knit,
    clampPlayerAnimationValue(clampPlayerAnimationValueResult3 * 0.8, 0, 1),
    1.6,
    deltaTime,
  );
  this.worry = dampPlayerAnimationValue(
    this.worry,
    clampPlayerAnimationValue((-frame.vy - 8) / 10, 0, 1) * airWeight,
    6,
    deltaTime,
  );
  for (let result52 of this.brows) {
    result52.inner.position.y =
      0.016 * this.raise + 0.008 * this.worry - 0.009 * this.knit + 0.006 * stretchAmount;
    result52.inner.rotation.z = result52.side * (0.38 * this.knit - 0.32 * this.worry);
  }
  this.mouth = dampPlayerAnimationValue(
    this.mouth,
    clampPlayerAnimationValue(pose.mouth + this.happy * 0.3, 0, 1),
    12,
    deltaTime,
  );
  this.smile.visible = this.mouth < 0.28;
  this.mouthO.visible = !this.smile.visible;
  this.mouthO.scale.set(0.75 + this.mouth * 0.3, 0.45 + this.mouth * 0.65, 1);
}
