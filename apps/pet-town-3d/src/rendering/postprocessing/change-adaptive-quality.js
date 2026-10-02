/** Postprocessing pipeline configuration, quality tiers, adaptive quality and render targets. */
import { applyRenderingQualityTier } from "./apply-rendering-quality-tier.js";
import { renderingState } from "../state.js";
export function changeAdaptiveQuality(tier) {
  applyRenderingQualityTier(tier);
  renderingState.postprocessingState.slowTime = 0;
  renderingState.postprocessingState.fastTime = 0;
  renderingState.postprocessingState.warm = 0;
  renderingState.postprocessingState.frameEMA = 1 / 60;
  try {
    let setReflection2 = renderingState.postprocessingState.ctx.water?.setReflection;
    if (typeof setReflection2 == `function`) {
      if (tier.name === `low` && !renderingState.postprocessingState.reflOffByUs) {
        setReflection2.call(renderingState.postprocessingState.ctx.water, false);
        renderingState.postprocessingState.reflOffByUs = true;
      } else {
        if (tier.name !== `low` && renderingState.postprocessingState.reflOffByUs) {
          setReflection2.call(renderingState.postprocessingState.ctx.water, true);
          renderingState.postprocessingState.reflOffByUs = false;
        }
      }
    }
  } catch {}
}
