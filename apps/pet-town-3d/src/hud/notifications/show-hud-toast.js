/** Toast and banner announcements. */
import { hudState } from "../state.js";
import { createHudElement } from "../state/create-hud-element.js";
import { playHudSound } from "../state/play-hud-sound.js";
export function showHudToast(message, options = {}) {
  if (!hudState.hudElements.toasts) {
    return;
  }
  let result = hudState.hudIcons[options.icon ?? `sparkle`] ?? hudState.hudIcons.sparkle;
  let hudElementResult = createHudElement(
    `<div class="pk-toast"><span class="ic" style="--tc:${options.color ?? `#ffe6a8`}">${result}</span><span></span></div>`,
  );
  for (
    hudElementResult.lastElementChild.textContent = message,
      hudState.hudElements.toasts.append(hudElementResult);
    hudState.hudElements.toasts.children.length > 4;
  ) {
    hudState.hudElements.toasts.firstElementChild.remove();
  }
  if (options.sound !== false) {
    playHudSound(`toast`);
  }
  setTimeout(() => {
    hudElementResult.classList.add(`out`);
    setTimeout(() => hudElementResult.remove(), 400);
  }, options.duration ?? 2800);
  return hudElementResult;
}
