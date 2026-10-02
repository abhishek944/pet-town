/** Clock formatting and photo capture, download and preview effects. */
import { hudState } from "../state.js";
export function getPhotoCaptureCanvas(sourceCanvas) {
  let result = Math.min(1, 2560 / Math.max(sourceCanvas.width, sourceCanvas.height));
  let result2 = Math.round(sourceCanvas.width * result);
  let result3 = Math.round(sourceCanvas.height * result);
  if (
    !hudState.hudRuntime.snap ||
    hudState.hudRuntime.snap.width !== result2 ||
    hudState.hudRuntime.snap.height !== result3
  ) {
    hudState.hudRuntime.snap = Object.assign(document.createElement(`canvas`), {
      width: result2,
      height: result3,
    });
    let painter = hudState.hudRuntime.snap.getContext(`2d`);
    painter.imageSmoothingEnabled = true;
    painter.imageSmoothingQuality = `high`;
  }
  return hudState.hudRuntime.snap;
}
