/** Public HUD API, keyboard hooks and update loop. */
import { hudState } from "../state.js";
import { clampHudUnit } from "../state/clamp-hud-unit.js";
import { capturePhoto } from "../photo/capture-photo.js";
import { updateSplashCamera } from "../splash-camera/update-splash-camera.js";
import { updateClockAndWeather } from "../updates/update-clock-and-weather.js";
import { updateHudHotbar } from "../updates/update-hud-hotbar.js";
import { updateInteractionPrompt } from "../updates/update-interaction-prompt.js";
import { updateHudReticle } from "../updates/update-hud-reticle.js";
export function updateHud(deltaTime, context) {
  if (hudState.hudRuntime.splash) {
    hudState.hudRuntime.splashT += deltaTime;
    hudState.hudRuntime.frames++;
    let clampHudUnitResult = clampHudUnit(
      Math.min(hudState.hudRuntime.frames / 20, hudState.hudRuntime.splashT / 1.4),
    );
    hudState.hudElements.splashBar.style.width = (clampHudUnitResult * 100).toFixed(1) + `%`;
    hudState.hudElements.splashBar.parentElement.setAttribute(
      "aria-valuenow",
      String(Math.round(clampHudUnitResult * 100)),
    );
    if (clampHudUnitResult >= 1 && !hudState.hudElements.splash.classList.contains(`ready`)) {
      hudState.hudElements.splash.classList.add(`ready`);
      hudState.hudElements.splashBar.parentElement.setAttribute("aria-hidden", "true");
    }
  }
  if (hudState.hudRuntime.capture > 0 && --hudState.hudRuntime.capture === 0) {
    queueMicrotask(capturePhoto);
  }
  updateSplashCamera(deltaTime);
  let result = (((hudState.hudContext.timeOfDay ?? 0.4) % 1) + 1) % 1;
  let result2 = 1 - clampHudUnit(Math.min((result - 0.2) / 0.07, (0.83 - result) / 0.07));
  let toFixedResult = (Math.round(result2 * 50) / 50).toFixed(2);
  if (toFixedResult !== hudState.hudRuntime.nightCss) {
    hudState.hudRuntime.nightCss = toFixedResult;
    hudState.hudElements.hudEl.style.setProperty(`--night`, toFixedResult);
    hudState.hudRootElement.classList.toggle(`dim`, result2 > 0.02);
  }
  if (hudState.hudRuntime.help) hudState.settingsView?.render();
  updateClockAndWeather(deltaTime);
  updateHudHotbar();
  updateInteractionPrompt(deltaTime);
  updateHudReticle(deltaTime);
  if (hudState.hudRuntime.nameTimer > 0 && (hudState.hudRuntime.nameTimer -= deltaTime) <= 0) {
    hudState.hudElements.bname.classList.remove(`show`);
  }
  let audio2 = hudState.hudContext.audio;
  if (audio2 && hudState.hudElements.snd) {
    let result3 = !!audio2.muted;
    hudState.hudElements.snd.setAttribute(
      "aria-label",
      result3 ? "Unmute world sound (M)" : "Mute world sound (M)",
    );
    hudState.hudElements.snd.setAttribute("aria-pressed", String(result3));
    if (hudState.hudElements.snd.classList.contains(`muted`) !== result3) {
      hudState.hudElements.snd.classList.toggle(`muted`, result3);
      hudState.hudElements.snd.firstElementChild.outerHTML = result3
        ? hudState.hudIcons.mute
        : hudState.hudIcons.sound;
    }
  }
}
