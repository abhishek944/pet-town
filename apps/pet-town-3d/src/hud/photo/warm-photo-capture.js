/** Clock formatting and photo capture, download and preview effects. */
import { hudState } from "../state.js";
import { getPhotoCaptureCanvas } from "./get-photo-capture-canvas.js";
export function warmPhotoCapture() {
  let result = hudState.hudContext.renderer?.domElement ?? hudState.hudContext.canvas;
  if (result) {
    try {
      getPhotoCaptureCanvas(result).getContext(`2d`).drawImage(result, 0, 0, 8, 8);
    } catch {}
    for (let result2 of [
      hudState.hudElements.flash,
      hudState.hudElements.vig,
      hudState.hudElements.frame,
    ]) {
      result2.style.opacity = `.002`;
    }
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        for (let result3 of [
          hudState.hudElements.flash,
          hudState.hudElements.vig,
          hudState.hudElements.frame,
        ]) {
          result3.style.opacity = ``;
        }
      }),
    );
  }
}
