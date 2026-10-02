/** Postprocessing pipeline configuration, quality tiers, adaptive quality and render targets. */
import { renderingState } from "../state.js";
export function resizePostprocessing(context) {
  if (renderingState.postprocessingState) {
    renderingState.postprocessingState.warm = 0;
    renderingState.postprocessingState.slowTime = 0;
    renderingState.postprocessingState.fastTime = 0;
    renderingState.postprocessingState.composer.setSize(
      context.viewport?.width ?? innerWidth,
      context.viewport?.height ?? innerHeight,
    );
  }
}
