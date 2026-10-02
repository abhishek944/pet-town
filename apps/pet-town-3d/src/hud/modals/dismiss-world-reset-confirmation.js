/** World reset confirmation, help modal and player-input blocking. */
import { hudState } from "../state.js";
import { playHudSound } from "../state/play-hud-sound.js";
import { synchronizeHudInputBlocking } from "./synchronize-hud-input-blocking.js";
export function dismissWorldResetConfirmation() {
  hudState.hudRuntime.confirm = false;
  hudState.hudElements.confirm.hidden = true;
  hudState.hudElements.confirm.classList.remove(`show`);
  playHudSound(`close`);
  synchronizeHudInputBlocking();
  hudState.hudElements.help.inert = false;
  if (hudState.hudRuntime.help) hudState.hudElements.help.querySelector("[data-a=reset]").focus();
}
