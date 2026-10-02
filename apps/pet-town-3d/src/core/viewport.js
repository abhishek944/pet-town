import { resizePostprocessing } from "../rendering/postprocessing/resize-postprocessing.js";

/** Keep camera, canvas and all postprocessing passes on the same world viewport. */
export function createGameViewport(context) {
  let rightInset = 0;
  context.resizeViewport = (inset = rightInset) => {
    rightInset = Math.max(0, Math.min(innerWidth - 1, inset));
    const width = Math.max(1, innerWidth - rightInset);
    const height = Math.max(1, innerHeight);
    context.viewport = { width, height, rightInset };
    context.renderer.setSize(width, height);
    context.camera.aspect = width / height;
    context.camera.updateProjectionMatrix();
    resizePostprocessing(context);
  };
  context.resizeViewport();
  addEventListener("resize", () => context.resizeViewport());
}
