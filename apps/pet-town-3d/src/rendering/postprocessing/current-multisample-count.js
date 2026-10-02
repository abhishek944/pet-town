/** Postprocessing pipeline configuration, quality tiers, adaptive quality and render targets. */
import { renderingState } from "../state.js";
export function currentMultisampleCount() {
  let samples2 = renderingState.postprocessingState.tier.samples;
  return samples2 > 0 && renderingState.postprocessingState.pr > 1.25
    ? Math.min(2, samples2)
    : samples2;
}
