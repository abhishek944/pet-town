/** Postprocessing pipeline configuration, quality tiers, adaptive quality and render targets. */
import { renderingState } from "../state.js";
export function notifyQualityListeners() {
  let tier2 = renderingState.postprocessingState.tier;
  for (let result of renderingState.postprocessingState.tierListeners) {
    try {
      result(tier2);
    } catch (result2) {
      console.warn(`[post] onTier listener`, result2);
    }
  }
  try {
    window.dispatchEvent(
      new CustomEvent(`post:tier`, {
        detail: tier2,
      }),
    );
  } catch {}
}
