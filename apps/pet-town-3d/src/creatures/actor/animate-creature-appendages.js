import { animateBirdWing } from "../flight/animate-bird-wing.js";
import { creaturesState } from "../state.js";
import { emitNearbyCreatureParticles } from "../world/emit-nearby-creature-particles.js";
export function animateCreatureAppendages(
  parts,
  gait,
  moveAmount,
  lieAmount,
  hopPhase,
  time,
  isFlying,
  species,
  frame,
  deltaTime,
) {
  for (let result27 of parts.legs) {
    let obj2 = result27.obj;
    obj2.rotation.copy(result27.r0);
    let result28 = obj2.position.z > 0;
    if (gait === `trot`) {
      let result29 = (this.phase + result27.phase) * creaturesState.creatureBehaviorTau;
      obj2.rotation.x += Math.sin(result29) * result27.amp * Math.min(1.2, moveAmount);
      if (this.airborne) {
        obj2.rotation.x += (result27.phase ? 0.5 : -0.5) * 0.6;
      }
      obj2.rotation.x += lieAmount * (result28 ? -1.3 : 1.3);
      if (result27.knee) {
        result27.knee.rotation.x =
          Math.max(0, Math.sin(result29 + creaturesState.creatureBehaviorTau * 0.25)) *
            0.9 *
            Math.min(1, moveAmount) *
            (result28 ? 1 : -0.8) +
          lieAmount * (result28 ? 1.7 : -1.6) +
          (this.airborne ? 0.5 : 0);
      }
    } else if (gait === `scuttle`) {
      let result30 = Math.sin((this.phase + result27.phase) * creaturesState.creatureBehaviorTau);
      obj2.rotation.y += result30 * 0.45 * Math.min(1.2, moveAmount);
      obj2.rotation.z +=
        Math.max(0, Math.cos((this.phase + result27.phase) * creaturesState.creatureBehaviorTau)) *
        0.3 *
        Math.min(1, moveAmount) *
        Math.sign(obj2.position.x);
      obj2.rotation.z -= lieAmount * 1.15 * Math.sign(obj2.position.x);
    } else {
      if (gait === `hop`) {
        if (result27.hind) {
          obj2.rotation.x +=
            -hopPhase * 1.1 +
            (this.inWater ? Math.sin(time * 8 + (obj2.position.x > 0 ? 0 : Math.PI)) * 0.5 : 0);
          obj2.rotation.z += lieAmount * 0.55 * Math.sign(obj2.position.x);
        } else {
          obj2.rotation.x +=
            hopPhase * -0.6 +
            lieAmount * -1.1 +
            (this.inWater ? Math.sin(time * 8 + (obj2.position.x > 0 ? Math.PI : 0)) * 0.4 : 0);
          obj2.rotation.z += lieAmount * 0.35 * Math.sign(obj2.position.x);
        }
      } else {
        if (gait === `hop2`) {
          obj2.rotation.x += isFlying ? 0.9 : -hopPhase * 0.5 + this.graze * -0.3;
        } else {
          if (gait === `fly`) {
            obj2.rotation.x += 0.3 + Math.sin(time * 3 + result27.phase * 3) * 0.2;
          }
        }
      }
    }
  }
  for (let result31 of parts.wings) {
    let obj3 = result31.obj;
    obj3.rotation.copy(result31.r0);
    if (result31.bird && species.flight) {
      animateBirdWing.call(this, result31, time, isFlying, species.flight, deltaTime);
      continue;
    }
    let side2 = result31.side;
    if (gait === `fly`) {
      if (this.flyH < 0.1 && !isFlying) {
        obj3.rotation.z +=
          side2 *
          (Math.sin(time * 1.4 + this.id) * 0.2 * (1 - lieAmount) - 0.05 + lieAmount * 1.05);
        obj3.rotation.x += -0.55 * lieAmount;
      } else {
        obj3.rotation.z += side2 * (Math.sin(time * 9 + this.id) * 0.5 + 0.05);
      }
    } else if (isFlying) {
      obj3.rotation.z += -side2 * (1.25 + Math.sin(time * 26 + this.id) * 0.75);
    } else {
      let result32 =
        this.happy * Math.max(0, Math.sin(time * 18)) * 0.8 +
        (this.airborne ? 0.4 : 0) +
        hopPhase * 0.3;
      obj3.rotation.z += -side2 * result32;
    }
  }
  if (
    species.glowHalo &&
    isFlying &&
    frame.night > 0.5 &&
    !this.pose &&
    this.rng() < deltaTime * 2.5
  ) {
    emitNearbyCreatureParticles(
      creaturesState.creatureWorldTargetScratch
        .set(0, 0.25 * this.size, -0.1)
        .applyQuaternion(this.mesh.quaternion)
        .add(this.position),
      `sparkle`,
      {
        count: 1,
        scale: 0.45,
      },
    );
  }
}
