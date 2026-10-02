/** Public HUD API, keyboard hooks and update loop. */
import { hudState } from "../state.js";
import { showHudToast } from "../notifications/show-hud-toast.js";
import { showHudBanner } from "../notifications/show-hud-banner.js";
import { requestPhotoCapture } from "../photo/request-photo-capture.js";
import { toggleHudHelp } from "../modals/toggle-hud-help.js";
export function prepareHudLifecycle() {
  hudState.hudApi = {
    toast: showHudToast,
    banner: showHudBanner,
    photo: requestPhotoCapture,
    toggleHelp: toggleHudHelp,
    prompt(value, keyValue) {
      if (keyValue) {
        hudState.hudRuntime.prompts.set(value, {
          key: keyValue.key ?? `E`,
          label: keyValue.label ?? ``,
          name: keyValue.name ?? ``,
        });
      } else {
        hudState.hudRuntime.prompts.delete(value);
      }
    },
    clearPrompt(value) {
      hudState.hudRuntime.prompts.delete(value);
    },
    setVisible(value) {
      hudState.hudRuntime.hidden = !value;
      hudState.hudRootElement.classList.toggle(`hidden`, !value);
    },
    get hidden() {
      return hudState.hudRuntime.hidden;
    },
    get photoMode() {
      return hudState.hudRuntime.photoMode;
    },
    get bannerActive() {
      return performance.now() < (hudState.hudRuntime.bannerUntil ?? 0);
    },
    get confirmOpen() {
      return !!hudState.hudRuntime.confirm;
    },
    get lastCaptureMs() {
      return hudState.hudRuntime.lastCaptureMs;
    },
    get blocking() {
      return (
        !!(hudState.hudRuntime.splash || hudState.hudRuntime.help || hudState.hudRuntime.confirm) ||
        performance.now() - (hudState.hudRuntime.splashOffAt ?? -1e9) < 600
      );
    },
    get helpOpen() {
      return hudState.hudRuntime.help;
    },
    get title() {
      return hudState.hudRuntime.title;
    },
    lastPhoto: null,
  };
}
