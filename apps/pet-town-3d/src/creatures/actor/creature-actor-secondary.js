/** Creature state machine, social behavior, movement, animation and interaction methods. */
import * as THREE from "three";
import { creaturesState } from "../state.js";
import { dampCreatureValue } from "../math/damp-creature-value.js";
export function creatureActorSecondary(deltaTime) {
  this.mesh.updateMatrixWorld(true);
  let result =
    this.happy > 0.3 ||
    this.state === `greet` ||
    this.state === `play` ||
    this.state === `approach`;
  this.wag = dampCreatureValue(this.wag ?? 0, +!!result, 4, deltaTime);
  this.twitchT = (this.twitchT ?? this.rng.range(1, 4)) - deltaTime;
  let result2 = this.twitchT <= 0 && this.sleep < 0.5;
  if (result2) {
    this.twitchT = this.rng.range(1.5, 5);
  }
  for (let result3 of this.parts.jiggles) {
    if (result3.name === `tail`) {
      let result4 = this.def.sleepPose === `curl` ? (this.lie ?? 0) : 0;
      if (this.wag > 0.01 || result4 > 0.01) {
        let result5 =
          result3.obj.userData.animQ ?? (result3.obj.userData.animQ = new THREE.Quaternion());
        result5.setFromAxisAngle(
          result3.wagAxis,
          Math.sin(creaturesState.creaturesRuntime.time * 15 + this.id) * 0.45 * this.wag -
            2.3 * result4,
        );
        if (result4 > 0.01) {
          result5.multiply(
            creaturesState.creatureJiggleIdentityScratch.setFromAxisAngle(
              creaturesState.creatureRightAxis,
              0.9 * result4,
            ),
          );
        }
      } else {
        if (result3.obj.userData.animQ) {
          result3.obj.userData.animQ.identity();
        }
      }
    }
    if (
      result2 &&
      (result3.name === `earL` ||
        result3.name === `earR` ||
        result3.name === `antL` ||
        result3.name === `antR`) &&
      this.rng() < 0.7
    ) {
      result3.impulse
        .set(this.rng.range(-1, 1), this.rng.range(0.5, 1.5), this.rng.range(-1, 1))
        .multiplyScalar(0.9);
    }
    result3.update(deltaTime);
  }
}
