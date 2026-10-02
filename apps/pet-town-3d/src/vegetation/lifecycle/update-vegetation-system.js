/** Guarded initialization and per-frame vegetation updates including props, water bobbing, quality and wind. */
import { guardVegetationLifecycle } from "./guard-vegetation-lifecycle.js";
import { updateVegetationRuntime } from "./update-vegetation-runtime.js";
export function updateVegetationSystem(value, value2) {
  guardVegetationLifecycle(() => updateVegetationRuntime(value, value2), `update`);
}
