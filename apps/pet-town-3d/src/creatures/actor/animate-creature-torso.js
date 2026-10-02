import { creaturesState } from "../state.js";
import { wrapCreatureAngle } from "../math/wrap-creature-angle.js";
import { clampCreatureValue } from "../math/clamp-creature-value.js";
export function animateCreatureTorso(
  hopPhase,
  gait,
  lieAmount,
  sleepPose,
  time,
  deltaTime,
  parts,
  hopHeight,
  species,
  moveAmount,
  isFlying,
  isSleeping,
) {
  let result4 =
    (this.airborne ? clampCreatureValue(this.vy * 0.02, -0.1, 0.14) : 0) +
    hopPhase * 0.08 * (gait === `bounce` ? 1.5 : 1) -
    lieAmount * (sleepPose === `flat` ? 0.1 : 0.05) +
    (gait === `bounce` ? Math.sin(time * 3 + this.id) * 0.015 : 0);
  let result5 = 1 + clampCreatureValue(this.sq.step(result4, deltaTime), -0.35, 0.35);
  let result6 = 1 / Math.sqrt(Math.max(0.3, result5));
  if (sleepPose === `puddle`) {
    let result25 = this.sleep + (lieAmount - this.sleep) * 0.45;
    let result26 = Math.sin(time * 2.6 + this.id) * 0.035 * result25;
    result5 *= 1 - 0.3 * result25 + result26;
    result6 *= 1 + 0.16 * result25 - result26 * 0.5;
  }
  if (sleepPose === `fluff`) {
    result5 *= 1 + 0.12 * lieAmount;
    result6 *= 1 + 0.12 * lieAmount;
  }
  parts.bob.scale.set(result6, result5, result6);
  let bodyLift = hopHeight;
  let walkBob = 0;
  if (gait === `trot`) {
    walkBob =
      species.bob *
      (0.5 + 0.5 * Math.cos(this.phase * creaturesState.creatureBehaviorTau * 2)) *
      Math.min(1, moveAmount);
    bodyLift += walkBob;
  }
  if (gait === `scuttle`) {
    bodyLift +=
      species.bob *
      Math.abs(Math.sin(this.phase * creaturesState.creatureBehaviorTau * 3)) *
      Math.min(1, moveAmount);
  }
  if (isFlying) {
    bodyLift += Math.sin(time * 2.2 + this.id) * 0.05;
  }
  if (this.inWater) {
    bodyLift += Math.sin(time * 2 + this.id) * 0.02;
  }
  let result7 =
    lieAmount *
    (sleepPose === `chin`
      ? -0.13
      : sleepPose === `curl`
        ? -0.15
        : sleepPose === `tent`
          ? -0.17
          : sleepPose === `flat`
            ? -0.075
            : gait === `trot`
              ? -0.09
              : gait === `scuttle`
                ? -0.05
                : -0.02);
  parts.bob.position.y = bodyLift + result7;
  let clampCreatureValueResult = clampCreatureValue(
    ((this.speed - (this._ps ?? 0)) / Math.max(deltaTime, 0.001)) * 0.03,
    -0.25,
    0.25,
  );
  this._ps = this.speed;
  let result8 =
    -clampCreatureValueResult * 0.5 +
    (isFlying ? 0.18 * clampCreatureValue(this.speed / species.walk, 0, 1.5) : 0.06 * moveAmount) +
    this.graze * (gait === `hop2` ? 0.25 : 0.08) +
    (this.airborne ? -this.vy * 0.02 : 0);
  this.lean.step(result8, deltaTime);
  let result9 = wrapCreatureAngle(this.yaw - (this._py ?? this.yaw)) / Math.max(deltaTime, 0.001);
  this._py = this.yaw;
  this.roll.step(
    clampCreatureValue(-result9 * 0.06 * (0.3 + moveAmount), -0.3, 0.3) +
      (gait === `trot`
        ? Math.sin(this.phase * creaturesState.creatureBehaviorTau) * 0.04 * moveAmount
        : 0),
    deltaTime,
  );
  parts.body.rotation.x = parts.bodyRot0.x + this.lean.x;
  parts.body.rotation.z =
    parts.bodyRot0.z + this.roll.x + (sleepPose === `curl` ? 0.14 * lieAmount : 0);
  if (sleepPose === `flat`) {
    parts.body.rotation.x += 0.1 * lieAmount;
  }
  this.breath += deltaTime * (isSleeping ? 1.6 : 2.6);
  let result10 = Math.sin(this.breath) * (isSleeping ? 0.03 : 0.015);
  parts.body.scale.set(1 + result10 * 0.6, 1 + result10, 1 + result10 * 0.6);
  parts.body.position.y = parts.bodyY0;
  if (this.state === `happy`) {
    parts.body.rotation.z += Math.sin(time * 14) * 0.12 * this.happy;
  }
  return {
    walkBob,
  };
}
