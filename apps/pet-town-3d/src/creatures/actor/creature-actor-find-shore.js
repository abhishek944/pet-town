/** Creature state machine, social behavior, movement, animation and interaction methods. */
import * as THREE from "three";
import { creaturesState } from "../state.js";
import { isCreatureInsideWorld } from "../world/is-creature-inside-world.js";
import { sampleCreatureSupportHeight } from "../world/sample-creature-support-height.js";
import { getCreatureWaterLevel } from "../world/get-creature-water-level.js";
export function creatureActorFindShore() {
  for (let result = 1; result < 14; result += 1) {
    for (let index = 0; index < 12; index++) {
      let result2 = (index / 12) * creaturesState.creatureBehaviorTau;
      let result3 = this.position.x + Math.cos(result2) * result;
      let result4 = this.position.z + Math.sin(result2) * result;
      let creatureSupportHeightResult = sampleCreatureSupportHeight(result3, result4);
      if (
        creatureSupportHeightResult != null &&
        creatureSupportHeightResult >= getCreatureWaterLevel() &&
        isCreatureInsideWorld(result3, result4)
      ) {
        return new THREE.Vector3(result3, creatureSupportHeightResult, result4);
      }
    }
  }
  return null;
}
