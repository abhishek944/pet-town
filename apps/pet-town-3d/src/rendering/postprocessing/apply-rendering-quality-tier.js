/** Postprocessing pipeline configuration, quality tiers, adaptive quality and render targets. */
import { renderingState } from "../state.js";
import { currentMultisampleCount } from "./current-multisample-count.js";
import { resizePostRenderTargets } from "./resize-post-render-targets.js";
import { notifyQualityListeners } from "./notify-quality-listeners.js";
export function applyRenderingQualityTier(tier) {
  let {
    ctx: postprocessingStateValue,
    passes: postprocessingStateValue2,
    params: postprocessingStateValue3,
    mats: postprocessingStateValue4,
  } = renderingState.postprocessingState;
  renderingState.postprocessingState.tier = tier;
  let result = (renderingState.postprocessingState.pr = Math.min(
    window.devicePixelRatio || 1,
    tier.pr,
  ));
  const width = postprocessingStateValue.viewport?.width ?? innerWidth;
  const height = postprocessingStateValue.viewport?.height ?? innerHeight;
  postprocessingStateValue.renderer.setPixelRatio(result);
  postprocessingStateValue.renderer.setSize(width, height);
  if (postprocessingStateValue4.aoMat.defines.AO_SAMPLES !== (tier.aoSamples || 8)) {
    postprocessingStateValue4.aoMat.defines.AO_SAMPLES = tier.aoSamples || 8;
    postprocessingStateValue4.aoMat.needsUpdate = true;
  }
  postprocessingStateValue2.fxaaPass.enabled = tier.fxaa;
  renderingState.postprocessingState.composer.setPixelRatio(result);
  renderingState.postprocessingState.composer.setSize(width, height);
  if (
    renderingState.postprocessingState.T.scene &&
    (renderingState.postprocessingState.T.scene.samples !== currentMultisampleCount() ||
      renderingState.postprocessingState.T.aoScale !== (tier.aoScale ?? 0.5))
  ) {
    resizePostRenderTargets(
      renderingState.postprocessingState.T.scene.width,
      renderingState.postprocessingState.T.scene.height,
    );
  }
  postprocessingStateValue3.sharpenEff = postprocessingStateValue3.sharpen ?? tier.sharpen;
  renderingState.postprocessingState.warm = 0;
  if (renderingState.postprocessingState.lastEmitted !== tier.name) {
    renderingState.postprocessingState.lastEmitted = tier.name;
    if (renderingState.postprocessingState.ready) {
      notifyQualityListeners();
    }
  }
}
