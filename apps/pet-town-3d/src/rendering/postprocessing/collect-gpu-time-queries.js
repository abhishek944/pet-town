/** Postprocessing pipeline configuration, quality tiers, adaptive quality and render targets. */
import { renderingState } from "../state.js";
export function collectGpuTimeQueries(query) {
  let gpuT2 = renderingState.postprocessingState.gpuT;
  if (!gpuT2?.ext) {
    return;
  }
  let painter = renderingState.postprocessingState.ctx.renderer.getContext();
  if (query) {
    painter.endQuery(gpuT2.ext.TIME_ELAPSED_EXT);
    gpuT2.active = false;
    gpuT2.pending.push(query);
  }
  let parameterResult = painter.getParameter(gpuT2.ext.GPU_DISJOINT_EXT);
  for (
    ;
    gpuT2.pending.length &&
    painter.getQueryParameter(gpuT2.pending[0], painter.QUERY_RESULT_AVAILABLE);
  ) {
    let shiftResult = gpuT2.pending.shift();
    let result = painter.getQueryParameter(shiftResult, painter.QUERY_RESULT) / 1e6;
    painter.deleteQuery(shiftResult);
    if (!parameterResult && result > 0 && result < 500) {
      gpuT2.ema = gpuT2.ema ? gpuT2.ema + (result - gpuT2.ema) * 0.05 : result;
    }
  }
}
