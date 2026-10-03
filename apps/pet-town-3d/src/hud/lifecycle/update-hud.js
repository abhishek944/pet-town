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
  const splash = hudState.hudElements.splash;
  const persistence = context.building?.persistence;
  if (
    hudState.hudRuntime.splash &&
    !splash.classList.contains("ready") &&
    context.ready &&
    context.hasRenderedFrame &&
    (!persistence?.on || persistence.loaded)
  ) {
    splash.classList.add("ready");
    splash.setAttribute("aria-busy", "false");
    splash.querySelector(".town-loading").hidden = true;
    splash.querySelector(".town-start").disabled = false;
    splash.querySelector(".public-boot-links")?.remove();
    dispatchEvent(new Event("pet-town:playable"));
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
