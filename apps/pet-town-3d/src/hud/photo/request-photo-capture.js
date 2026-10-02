/** Clock formatting and photo capture, download and preview effects. */
import { hudState } from "../state.js";
import { toggleHudHelp } from "../modals/toggle-hud-help.js";
export function requestPhotoCapture() {
  if (!(hudState.hudRuntime.photoBusy || hudState.hudRuntime.splash)) {
    hudState.hudRuntime.photoBusy = true;
    hudState.hudRuntime.photoMode = true;
    hudState.hudRootElement.classList.add(`off`);
    if (hudState.hudRuntime.help) {
      toggleHudHelp(false, true);
    }
    hudState.hudRuntime.capture = 2;
  }
}
