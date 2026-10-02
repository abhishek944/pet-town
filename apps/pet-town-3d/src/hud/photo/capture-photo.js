/** Clock formatting and photo capture, download and preview effects. */
import { hudState } from "../state.js";
import { getPhotoCaptureCanvas } from "./get-photo-capture-canvas.js";
import { playHudSound } from "../state/play-hud-sound.js";
export function capturePhoto() {
  let result = hudState.hudContext.renderer?.domElement ?? hudState.hudContext.canvas;
  let result2 = performance.now();
  let canvas2 = null;
  try {
    canvas2 = getPhotoCaptureCanvas(result);
    canvas2.getContext(`2d`).drawImage(result, 0, 0, canvas2.width, canvas2.height);
  } catch (result3) {
    console.warn(`[hud] photo grab failed`, result3);
    canvas2 = null;
  }
  hudState.hudRuntime.lastCaptureMs = +(performance.now() - result2).toFixed(1);
  playHudSound(`shutter`);
  for (let result4 of [
    hudState.hudElements.flash,
    hudState.hudElements.vig,
    hudState.hudElements.frame,
  ]) {
    result4.classList.remove(`go`);
    result4.offsetWidth;
    result4.classList.add(`go`);
  }
  setTimeout(() => {
    hudState.hudRootElement.classList.remove(`off`);
    hudState.hudRuntime.photoMode = false;
  }, 1100);
  let callback = (typeValue) => {
    let date = new Date();
    let callback2 = (value) => String(value).padStart(2, `0`);
    let result5 =
      typeValue?.type === `image/webp` ? `webp` : typeValue?.type === `image/png` ? `png` : `jpg`;
    let text = `${hudState.hudRuntime.title.toLowerCase().replace(/\s+/g, `-`)}-${date.getFullYear()}${callback2(date.getMonth() + 1)}${callback2(date.getDate())}-${callback2(date.getHours())}${callback2(date.getMinutes())}${callback2(date.getSeconds())}`;
    if (typeValue) {
      if (hudState.hudRuntime.lastPhotoURL) {
        URL.revokeObjectURL(hudState.hudRuntime.lastPhotoURL);
      }
      let result6 = (hudState.hudRuntime.lastPhotoURL = URL.createObjectURL(typeValue));
      if (
        ((hudState.hudApi.lastPhoto = {
          url: result6,
          blob: typeValue,
          name: text + `.` + result5,
          width: canvas2?.width,
          height: canvas2?.height,
        }),
        (hudState.hudElements.polImg.src = result6),
        (hudState.hudElements.polCap.textContent = text),
        !hudState.hudContext.params?.has?.(`nodownload`) && !navigator.webdriver)
      ) {
        let element = document.createElement(`a`);
        element.href = result6;
        element.download = text + `.` + result5;
        document.body.append(element);
        element.click();
        element.remove();
      }
    }
    hudState.hudElements.pol.classList.add(`show`);
    setTimeout(() => {
      hudState.hudElements.pol.classList.remove(`show`);
      hudState.hudRuntime.photoBusy = false;
    }, 3200);
  };
  setTimeout(() => {
    if (!canvas2) {
      return callback(null);
    }
    try {
      canvas2.toBlob(
        (typeValue2) =>
          typeValue2 && typeValue2.type === `image/webp`
            ? callback(typeValue2)
            : canvas2.toBlob((value2) => callback(value2), `image/jpeg`, 0.92),
        `image/webp`,
        0.92,
      );
    } catch (result7) {
      console.warn(`[hud] photo encode failed`, result7);
      callback(null);
    }
  }, 180);
}
