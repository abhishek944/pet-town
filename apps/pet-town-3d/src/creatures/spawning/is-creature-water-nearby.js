/** Habitat-aware spawning, safe location selection and inspection lineups. */
import { creaturesState } from "../state.js";
import { isCreaturePositionUnderwater } from "../world/is-creature-position-underwater.js";
export function isCreatureWaterNearby(value, value2, value3 = 5) {
  for (let index = 0; index < 16; index++) {
    let result = (index / 16) * creaturesState.creatureBehaviorTau;
    for (let result2 of [value3 * 0.5, value3]) {
      if (
        isCreaturePositionUnderwater(
          value + Math.cos(result) * result2,
          value2 + Math.sin(result) * result2,
        )
      ) {
        return true;
      }
    }
  }
  return false;
}
