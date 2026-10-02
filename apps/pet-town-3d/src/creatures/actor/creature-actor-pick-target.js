/** Creature state machine, social behavior, movement, animation and interaction methods. */
import * as THREE from "three";
import { creaturesState } from "../state.js";
import { isCreatureInsideWorld } from "../world/is-creature-inside-world.js";
import { sampleCreatureSupportHeight } from "../world/sample-creature-support-height.js";
import { getCreatureWaterLevel } from "../world/get-creature-water-level.js";
import { isCreaturePositionBlocked } from "../world/is-creature-position-blocked.js";
export function creatureActorPickTarget(radius, origin = this.home, options = {}) {
  let rng2 = this.rng;
  for (let index = 0; index < 14; index++) {
    let result = rng2() * creaturesState.creatureBehaviorTau;
    let result2 = (options.min ?? 0.6) + rng2() * radius;
    let result3 = origin.x + Math.cos(result) * result2;
    let result4 = origin.z + Math.sin(result) * result2;
    if (!isCreatureInsideWorld(result3, result4)) {
      continue;
    }
    let creatureSupportHeightResult = sampleCreatureSupportHeight(result3, result4);
    if (creatureSupportHeightResult == null) {
      continue;
    }
    let result5 = creatureSupportHeightResult < getCreatureWaterLevel() - 0.1;
    if (
      (options.water !== true || result5) &&
      (options.water === true || !result5 || this.flying) &&
      !(
        !this.flying &&
        Math.abs(creatureSupportHeightResult - this.position.y) > 3.2 &&
        !options.far
      ) &&
      (this.flying || !isCreaturePositionBlocked(result3, result4, this.def.radius + 0.2))
    ) {
      return new THREE.Vector3(result3, creatureSupportHeightResult, result4);
    }
  }
  return null;
}
