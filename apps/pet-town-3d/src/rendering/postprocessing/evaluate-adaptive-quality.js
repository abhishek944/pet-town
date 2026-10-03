/** Postprocessing pipeline configuration, quality tiers, adaptive quality and render targets. */
import { renderingState } from "../state.js";
import { changeAdaptiveQuality } from "./change-adaptive-quality.js";
export function evaluateAdaptiveQuality(now, deltaTime) {
  if (renderingState.postprocessingState.warm < 0.75) {
    return;
  }
  let frameEMA2 = renderingState.postprocessingState.frameEMA;
  let result = Math.min(deltaTime, 0.1);
  let result2 = renderingState.postprocessingState.gpuT?.ema || 0;
  let name2 = renderingState.postprocessingState.tier.name;
  if (
    ((renderingState.postprocessingState.slowTime =
      // Aim for smooth 60 Hz movement; the old threshold could leave the
      // game indefinitely at 48-50 FPS without reducing render cost.
      frameEMA2 > 1 / 55
        ? renderingState.postprocessingState.slowTime + result
        : Math.max(0, renderingState.postprocessingState.slowTime - result * 0.5)),
    renderingState.postprocessingState.warm > 2.5 &&
      result2 &&
      renderingState.postprocessingState.arrival[name2] == null &&
      (renderingState.postprocessingState.arrival[name2] = result2),
    renderingState.postprocessingState.trial)
  ) {
    if (renderingState.postprocessingState.slowTime > 1.2) {
      let from2 = renderingState.postprocessingState.trial.from;
      renderingState.postprocessingState.trial = null;
      renderingState.postprocessingState.upHold = Math.min(
        120,
        renderingState.postprocessingState.upHold * 2,
      );
      changeAdaptiveQuality(renderingState.renderingQualityTiers[from2]);
      console.info(
        `[post] quality ->`,
        from2,
        `(trial failed, next try after ${renderingState.postprocessingState.upHold}s of headroom)`,
      );
      return;
    }
    if (renderingState.postprocessingState.warm > 5) {
      renderingState.postprocessingState.trial = null;
      renderingState.postprocessingState.upHold = Math.max(
        8,
        renderingState.postprocessingState.upHold * 0.75,
      );
    }
    return;
  }
  if (
    renderingState.postprocessingState.warm > 3 &&
    renderingState.postprocessingState.slowTime > 3 &&
    name2 !== `low`
  ) {
    let result5 = name2 === `high` ? `med` : `low`;
    renderingState.postprocessingState.downInfo[name2] = {
      gpu: result2,
      frame: frameEMA2,
    };
    let toFixedResult = (frameEMA2 * 1e3).toFixed(1);
    changeAdaptiveQuality(renderingState.renderingQualityTiers[result5]);
    renderingState.postprocessingState.arrival[result5] = null;
    console.info(`[post] quality ->`, result5, `(avg frame ${toFixedResult}ms)`);
    return;
  }
  if (
    ((renderingState.postprocessingState.fastTime =
      frameEMA2 < 1 / 59 ? renderingState.postprocessingState.fastTime + result : 0),
    name2 === renderingState.postprocessingState.maxTier)
  ) {
    return;
  }
  let result3 = renderingState.postprocessingState.arrival[name2];
  let result4 =
    result2 &&
    result3 &&
    renderingState.postprocessingState.downInfo[name2 === `low` ? `med` : `high`] &&
    result2 < result3 * 0.75;
  if (
    (result4 && renderingState.postprocessingState.fastTime > 3) ||
    renderingState.postprocessingState.fastTime > renderingState.postprocessingState.upHold
  ) {
    let result6 = name2 === `low` ? `med` : `high`;
    renderingState.postprocessingState.trial = {
      from: name2,
    };
    changeAdaptiveQuality(renderingState.renderingQualityTiers[result6]);
    renderingState.postprocessingState.arrival[result6] = null;
    console.info(
      `[post] quality ->`,
      result6,
      result4 ? `(load lifted, trial)` : `(headroom, trial)`,
    );
  }
}
