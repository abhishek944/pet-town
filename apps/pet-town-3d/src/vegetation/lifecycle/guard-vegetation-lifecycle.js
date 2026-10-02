/** Guarded initialization and per-frame vegetation updates including props, water bobbing, quality and wind. */
import { vegetationState } from "../state.js";
export function guardVegetationLifecycle(value, value2) {
  try {
    return value();
  } catch (result) {
    if (vegetationState.vegetationErrorCount++ < 3) {
      console.error(`[vegetation] ` + value2 + ` failed:`, result);
    }
    return;
  }
}
