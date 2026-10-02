import { lerpPlayerAnimationValue } from "../animation-math/lerp-player-animation-value.js";
import { clampPlayerAnimationValue } from "../animation-math/clamp-player-animation-value.js";
import { dampPlayerAnimationValue } from "../animation-math/damp-player-animation-value.js";
import { wrapPlayerAnimationAngle } from "../animation-math/wrap-player-animation-angle.js";
export function updatePlayerLocomotionWeights(frame, deltaTime) {
  let targetWeights = {
    swim: +!!frame.swimming,
    glide: !frame.swimming && frame.gliding ? 1 : 0,
    air: +(!frame.swimming && !frame.gliding && !frame.onGround),
  };
  targetWeights.ground = 1 - targetWeights.swim - targetWeights.glide - targetWeights.air;
  let weights = this.w;
  for (let result25 of [`ground`, `air`, `glide`, `swim`]) {
    weights[result25] = dampPlayerAnimationValue(
      weights[result25],
      targetWeights[result25],
      result25 === `air` ? 14 : 10,
      deltaTime,
    );
  }
  let weightSum = weights.ground + weights.air + weights.glide + weights.swim || 1;
  let groundWeight = weights.ground / weightSum;
  let airWeight = weights.air / weightSum;
  let glideWeight = weights.glide / weightSum;
  let swimWeight = weights.swim / weightSum;
  weights.move = dampPlayerAnimationValue(
    weights.move,
    clampPlayerAnimationValue(frame.speed / 1.2, 0, 1),
    12,
    deltaTime,
  );
  this.runAmt = dampPlayerAnimationValue(this.runAmt, frame.runAmt, 6, deltaTime);
  let moveWeight = weights.move;
  let runWeight = this.runAmt;
  let lerpPlayerAnimationValueResult = lerpPlayerAnimationValue(0.46, 0.78, runWeight);
  this.phase +=
    (frame.speed / lerpPlayerAnimationValueResult) *
    Math.PI *
    deltaTime *
    (frame.onGround ? 1 : 0.25);
  this.swimPhase += deltaTime * (3.2 + frame.speed * 1.6);
  let phase = this.phase;
  let stepSin = Math.sin(phase);
  let stepCos = Math.cos(phase);
  let footIndex = Math.floor((phase + Math.PI / 2) / Math.PI);
  if (footIndex !== this.prevFoot && frame.onGround && !frame.swimming && moveWeight > 0.5) {
    this.events.push({
      type: `step`,
      side: footIndex & 1,
      run: runWeight > 0.5,
    });
  }
  this.prevFoot = footIndex;
  let angularVelocity =
    deltaTime > 0 ? wrapPlayerAnimationAngle(frame.facing - this.prevFacing) / deltaTime : 0;
  this.prevFacing = frame.facing;
  this.turnRate = dampPlayerAnimationValue(
    this.turnRate,
    clampPlayerAnimationValue(angularVelocity, -12, 12),
    10,
    deltaTime,
  );
  let acceleration = deltaTime > 0 ? (frame.speed - this.prevSpeed) / deltaTime : 0;
  this.prevSpeed = frame.speed;
  this.lean = dampPlayerAnimationValue(
    this.lean,
    clampPlayerAnimationValue(acceleration * 0.012, -0.22, 0.2),
    8,
    deltaTime,
  );
  this.bank = dampPlayerAnimationValue(
    this.bank,
    clampPlayerAnimationValue(-this.turnRate * frame.speed * 0.012, -0.32, 0.32),
    10,
    deltaTime,
  );
  return {
    groundWeight,
    airWeight,
    glideWeight,
    swimWeight,
    moveWeight,
    runWeight,
    phase,
    stepSin,
    stepCos,
    acceleration,
  };
}
