/** Creature state machine, social behavior, movement, animation and interaction methods. */
import * as THREE from "three";
import { creaturesState } from "../state.js";
export function creatureActorStartFlee(threat) {
  this.setState(`flee`, 3.5);
  let normalizeResult = creaturesState.creatureWorldTargetScratch
    .set(this.position.x - threat.x, 0, this.position.z - threat.z)
    .normalize();
  let result = null;
  for (let index = 0; index < 8 && !result; index++) {
    let result2 =
      Math.atan2(normalizeResult.x, normalizeResult.z) + (this.rng() - 0.5) * (0.6 + index * 0.3);
    let result3 = this.position.x + Math.sin(result2) * 5;
    let result4 = this.position.z + Math.cos(result2) * 5;
    if (this.canStandAt(result3, result4)) {
      result = new THREE.Vector3(result3, 0, result4);
    }
  }
  this.goal = result;
  this.goalSpeed = this.def.run;
  this.emote(`exclaim`, 1, true);
  setTimeout(() => this.emoter.kind === `exclaim` || this.emote(`sweat`, 1.2, true), 900);
  this.sq.kick(4);
  this.idleHop = 1;
  if (this.traits.canFly && this.rng() < 0.6) {
    this.flying = true;
    this.alt = this.rng.range(...this.def.flyAlt);
    this.state = `flee`;
  }
}
