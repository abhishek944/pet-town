/** World reset confirmation, help modal and player-input blocking. */
import { hudState } from "../state.js";
import { playHudSound } from "../state/play-hud-sound.js";
import { synchronizeHudInputBlocking } from "./synchronize-hud-input-blocking.js";
export function toggleHudHelp(open, silent = false) {
  let result = !!hudState.hudRuntime.help;
  hudState.hudRuntime.help = !!(open ?? !hudState.hudRuntime.help);
  hudState.hudElements.help.classList.toggle(`show`, hudState.hudRuntime.help);
  hudState.hudElements.scrim.classList.toggle(`show`, hudState.hudRuntime.help);
  hudState.hudElements.helpBtn.classList.toggle(`on`, hudState.hudRuntime.help);
  if (!silent && result !== hudState.hudRuntime.help) {
    playHudSound(hudState.hudRuntime.help ? `open` : `close`);
  }
  synchronizeHudInputBlocking();
  hudState.settingsView?.setOpen(hudState.hudRuntime.help);
  hudState.hudElements.helpBtn.setAttribute("aria-expanded", String(hudState.hudRuntime.help));
}
