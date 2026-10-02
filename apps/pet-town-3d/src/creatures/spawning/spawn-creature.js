/** Habitat-aware spawning, safe location selection and inspection lineups. */
import { creatureActor } from "../actor/creature-actor.js";
import { createCreatureRandom } from "../math/create-creature-random.js";
import { creaturesState } from "../state.js";
import { sampleCreatureSupportHeight } from "../world/sample-creature-support-height.js";
export function spawnCreature(radiusValue, value, value2, value3) {
  let creatureActor2 = new creatureActor(
    radiusValue,
    value,
    value2,
    value3,
    createCreatureRandom(
      (creaturesState.creaturesRuntime.seed * 7919 + creaturesState.nextCreatureId * 104729) >>> 0,
    ),
  );
  let creatureSupportHeightResult = sampleCreatureSupportHeight(
    value2,
    value3,
    radiusValue.radius * 0.5,
  );
  creatureActor2.position.y = creatureSupportHeightResult ?? 0;
  creatureActor2.lastPos.copy(creatureActor2.position);
  creaturesState.creaturesRuntime.group.add(creatureActor2.mesh);
  creaturesState.creaturesRuntime.list.push(creatureActor2);
  return creatureActor2;
}
