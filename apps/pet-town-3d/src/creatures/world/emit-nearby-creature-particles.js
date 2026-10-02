/** Creature system namespace, world state, terrain queries, obstruction checks and nearby effects. */
import { creaturesState } from "../state.js";
export function emitNearbyCreatureParticles(cloneValue, value, value2) {
  let fx2 = creaturesState.creaturesRuntime.ctx.fx;
  if (!fx2?.burst) {
    return;
  }
  let position2 = creaturesState.creaturesRuntime.ctx.camera?.position;
  if (!(position2 && position2.distanceToSquared(cloneValue) > 784)) {
    try {
      fx2.burst(cloneValue.clone ? cloneValue.clone() : cloneValue, value, value2);
    } catch {}
  }
}
