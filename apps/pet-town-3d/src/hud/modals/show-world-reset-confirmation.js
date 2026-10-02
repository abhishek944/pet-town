/** World reset confirmation, help modal and player-input blocking. */
import { hudState } from "../state.js";
import { playHudSound } from "../state/play-hud-sound.js";
import { synchronizeHudInputBlocking } from "./synchronize-hud-input-blocking.js";
export function showWorldResetConfirmation() {
  if (hudState.hudContext.building?.resetWorld) {
    hudState.hudRuntime.confirm = true;
    hudState.hudElements.confirm.hidden = false;
    hudState.hudElements.confirm.classList.add(`show`);
    playHudSound(`open`);
    synchronizeHudInputBlocking();
    hudState.hudElements.help.inert = true;
    hudState.hudElements.confirm.querySelector("[data-a=no]").focus();
  }
}
