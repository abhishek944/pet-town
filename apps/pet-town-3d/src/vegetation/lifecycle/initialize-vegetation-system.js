/** Guarded initialization and per-frame vegetation updates including props, water bobbing, quality and wind. */
import { guardVegetationLifecycle } from "./guard-vegetation-lifecycle.js";
import { initializeVegetationRuntime } from "./initialize-vegetation-runtime.js";
export function initializeVegetationSystem(value) {
  guardVegetationLifecycle(() => initializeVegetationRuntime(value), `init`);
}
