/** Toast and banner announcements. */
import { hudState } from "../state.js";
import { playHudSound } from "../state/play-hud-sound.js";
export function showHudBanner(title, subtitle = ``) {
  hudState.hudElements.banner.querySelector(`.pk-ribbon`).textContent = title;
  let element = hudState.hudElements.banner.querySelector(`.sub`);
  element.textContent = subtitle;
  element.style.display = subtitle ? `` : `none`;
  hudState.hudElements.banner.classList.remove(`show`);
  hudState.hudElements.banner.offsetWidth;
  hudState.hudElements.banner.classList.add(`show`);
  hudState.hudRuntime.bannerUntil = performance.now() + 4e3;
  playHudSound(`banner`);
}
