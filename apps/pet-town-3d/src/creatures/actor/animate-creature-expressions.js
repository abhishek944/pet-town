import { creaturesState } from "../state.js";
import { setCreatureRigPartVisible } from "../world/set-creature-rig-part-visible.js";
export function animateCreatureExpressions(deltaTime, isResting, parts, time, species, frame) {
  this.blinkT -= deltaTime;
  if (this.blinkT <= 0 && this.blink <= 0) {
    this.blink = 0.001;
  }
  if (this.blink > 0) {
    this.blink += deltaTime / (isResting ? 0.6 : 0.14);
    if (this.blink >= 1) {
      this.blink = 0;
      this.blinkT = isResting
        ? this.rng.range(1.2, 2.6)
        : this.blinkTwice
          ? 0.12
          : this.rng.range(1.8, 5);
      this.blinkTwice = !isResting && !this.blinkTwice && this.rng() < 0.25;
    }
  }
  let result15 = this.blink > 0 ? Math.sin(this.blink * Math.PI) : 0;
  let result16 = this.sleep > 0.5;
  let result17 = this.happy > 0.5 && !result16;
  let result18 = result15 > 0.35;
  for (let result39 of parts.eyes) {
    if (!result16 && !result17 && !result18) {
      result39.open.scale.set(1, 1 - result15 * 0.6, 1);
    } else {
      result39.open.scale.setScalar(0);
    }
    if (result39.shut) {
      setCreatureRigPartVisible(result39.shut, result16 || (result18 && !result17));
    }
    if (result39.happy) {
      setCreatureRigPartVisible(result39.happy, result17);
    }
  }
  let result19 = this.happy > 0.5 && !!parts.mouthHappy;
  let result20 =
    !result19 &&
    (this.happy > 0.5 ||
      this.mouthOpenT > 0 ||
      (this.graze > 0.6 && Math.sin(time * 9) > 0.3) ||
      this.state === `flee`);
  if (parts.mouthClosed) {
    setCreatureRigPartVisible(parts.mouthClosed, !result20 && !result19);
  }
  if (parts.mouthOpen) {
    setCreatureRigPartVisible(parts.mouthOpen, result20);
  }
  if (parts.mouthHappy) {
    setCreatureRigPartVisible(parts.mouthHappy, result19);
  }
  if (parts.blushHappy) {
    setCreatureRigPartVisible(parts.blushHappy, this.happy > 0.3);
  }
  if (parts.tongue && result19) {
    parts.tongue.scale.set(1, 1, 0.4 + 0.9 * Math.max(0, Math.sin(time * 11)));
  }
  if (parts.jaw) {
    parts.jaw.rotation.x =
      parts.jawRot0 +
      (this.happy > 0.5 || this.mouthOpenT > 0 || this.state === `flee`
        ? 0.35 + 0.15 * Math.sin(time * 16)
        : this.graze > 0.6
          ? 0.25 * Math.max(0, Math.sin(time * 14))
          : 0);
  }
  this.emoter.setSleeping(this.sleep > 0.6);
  this.emoter.update(
    deltaTime,
    creaturesState.creatureWorldTargetScratch.set(0, species.height + 0.05, 0.05),
    frame.camDist ?? 0,
  );
}
