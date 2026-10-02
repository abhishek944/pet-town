/** Postprocessing pipeline configuration, quality tiers, adaptive quality and render targets. */
import { renderingState } from "../state.js";
export function beginGpuTimeQuery() {
  let result = (renderingState.postprocessingState.gpuT ??= {
    ext: undefined,
    pending: [],
    ema: 0,
  });
  if (result.ext === undefined) {
    try {
      result.ext = renderingState.postprocessingState.ctx.renderer
        .getContext()
        .getExtension(`EXT_disjoint_timer_query_webgl2`);
    } catch {
      result.ext = null;
    }
  }
  if (
    !result.ext ||
    result.active ||
    renderingState.postprocessingState.locked ||
    result.pending.length > 4
  ) {
    return null;
  }
  let painter = renderingState.postprocessingState.ctx.renderer.getContext();
  let queryResult = painter.createQuery();
  painter.beginQuery(result.ext.TIME_ELAPSED_EXT, queryResult);
  result.active = true;
  return queryResult;
}
