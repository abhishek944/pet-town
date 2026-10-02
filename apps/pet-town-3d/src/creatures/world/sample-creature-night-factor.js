/** Creature system namespace, world state, terrain queries, obstruction checks and nearby effects. */
import { creaturesState } from "../state.js";
import { smoothstepCreatureValue } from "../math/smoothstep-creature-value.js";
export function sampleCreatureNightFactor() {
  let result = creaturesState.creaturesRuntime.ctx.params?.get?.(`creatureTime`);
  let result2 =
    result != null && result !== ``
      ? Number(result)
      : Number.isFinite(creaturesState.creaturesRuntime.ctx.timeOfDay)
        ? creaturesState.creaturesRuntime.ctx.timeOfDay
        : 0.4;
  return smoothstepCreatureValue(
    0.12,
    -0.18,
    -Math.cos(result2 * creaturesState.creatureBehaviorTau),
  );
}
