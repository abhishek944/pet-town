/** Postprocessing pipeline configuration, quality tiers, adaptive quality and render targets. */
import { renderingState } from "../state.js";
import { beginGpuTimeQuery } from "./begin-gpu-time-query.js";
import { collectGpuTimeQueries } from "./collect-gpu-time-queries.js";
export function renderPostprocessing(context) {
  if (!renderingState.postprocessingState || !renderingState.postprocessingState.params.enabled) {
    context.renderer.setRenderTarget(null);
    context.renderer.render(context.scene, context.camera);
    return;
  }
  let beginGpuTimeQueryResult = beginGpuTimeQuery();
  renderingState.postprocessingState.composer.render(context.dt);
  collectGpuTimeQueries(beginGpuTimeQueryResult);
}
