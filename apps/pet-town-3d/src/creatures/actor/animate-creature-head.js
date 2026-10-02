import { creaturesState } from "../state.js";
import { wrapCreatureAngle } from "../math/wrap-creature-angle.js";
import { clampCreatureValue } from "../math/clamp-creature-value.js";
import { dampCreatureValue } from "../math/damp-creature-value.js";
export function animateCreatureHead(
  species,
  time,
  lieAmount,
  deltaTime,
  walkBob,
  sleepPose,
  parts,
) {
  let lookYaw = 0;
  let lookPitch = 0;
  if (this.look && this.lookT > -1.5) {
    let headWorld2 = this.headWorld;
    let result33 = this.look.x - headWorld2.x;
    let result34 = this.look.y - headWorld2.y;
    let result35 = this.look.z - headWorld2.z;
    let result36 = species.headYawMax ?? 1.1;
    let result37 = species.headPitchMax ?? 0.55;
    lookYaw = clampCreatureValue(
      wrapCreatureAngle(Math.atan2(result33, result35) - this.yaw),
      -result36,
      result36,
    );
    lookPitch = clampCreatureValue(
      Math.atan2(result34, Math.hypot(result33, result35)),
      -result37,
      result37,
    );
    if (Math.abs(wrapCreatureAngle(Math.atan2(result33, result35) - this.yaw)) > 1.9) {
      lookYaw = 0;
      lookPitch = 0;
    }
  }
  if (this.lookT < -1.5) {
    this.look = null;
  }
  let result11 = !!this.traits.pecker;
  let result12 =
    this.graze * (result11 ? 0.3 + 0.05 * Math.sin(time * 14) : 0.55 + 0.12 * Math.sin(time * 7));
  let dampCreatureValueResult = dampCreatureValue(
    this.headPitch,
    lookPitch * (1 - this.graze) * (1 - lieAmount),
    6,
    deltaTime,
  );
  this.headPitch = dampCreatureValueResult;
  this.headYaw = dampCreatureValue(
    this.headYaw,
    lookYaw * (1 - this.graze * 0.7) * (1 - lieAmount),
    6,
    deltaTime,
  );
  this.headTilt = dampCreatureValue(
    this.headTilt,
    this.tiltGoal * (1 - lieAmount) + this.happy * Math.sin(time * 9) * 0.25,
    5,
    deltaTime,
  );
  let result13 =
    -dampCreatureValueResult +
    result12 +
    this.sleep * 0.3 +
    (lieAmount - this.sleep) * 0.1 -
    this.lean.x * 0.6;
  let headYaw2 = this.headYaw;
  let result14 = -walkBob * 0.6;
  let headOffsetZ = 0;
  if (
    (sleepPose === `chin` && ((result13 += 0.45 * lieAmount), (result14 -= 0.06 * lieAmount)),
    sleepPose === `curl` &&
      ((headYaw2 += 1.05 * lieAmount),
      (result13 += 0.4 * lieAmount),
      (result14 -= 0.06 * lieAmount)),
    sleepPose === `fluff` &&
      ((headYaw2 += 0.3 * lieAmount),
      (result13 += 0.3 * lieAmount),
      (result14 -= 0.07 * lieAmount),
      (headOffsetZ += 0.02 * lieAmount)),
    result11 &&
      ((headOffsetZ += 0.06 * this.graze),
      (result14 -= 0.05 * this.graze),
      (result13 = Math.min(result13, 0.4))),
    sleepPose === `tuck` && (headOffsetZ -= 0.08 * lieAmount),
    sleepPose === `flat` && ((result13 += 0.22 * lieAmount), (result14 -= 0.03 * lieAmount)),
    parts.head.rotation.set(
      parts.headRot0.x + result13,
      parts.headRot0.y + headYaw2,
      parts.headRot0.z + this.headTilt,
      `YXZ`,
    ),
    parts.head.position.set(
      parts.headPos0.x,
      parts.headPos0.y + result14,
      parts.headPos0.z + headOffsetZ,
    ),
    sleepPose === `tuck` && parts.head.scale.setScalar(1 - lieAmount * 0.12),
    parts.heart)
  ) {
    let result38 =
      Math.max(0, Math.sin(time * creaturesState.creatureBehaviorTau * (1.2 + this.happy * 0.8))) **
      6;
    parts.heart.scale.setScalar(1 + 0.12 * result38);
  }
}
