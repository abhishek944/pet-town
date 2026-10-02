/** World reset confirmation, help modal and player-input blocking. */
import { hudState } from "../state.js";
import { toggleHudHelp } from "./toggle-hud-help.js";
import { showHudToast } from "../notifications/show-hud-toast.js";
export function confirmWorldReset() {
  hudState.hudRuntime.confirm = false;
  hudState.hudElements.confirm.hidden = true;
  hudState.hudElements.help.inert = false;
  hudState.hudElements.confirm.classList.remove(`show`);
  let resetWorldResult = hudState.hudContext.building.resetWorld();
  toggleHudHelp(false);
  showHudToast(
    resetWorldResult
      ? `Fresh start! ${resetWorldResult} block${resetWorldResult === 1 ? `` : `s`} went back to nature`
      : `Your world is already fresh`,
    {
      icon: `leaf`,
      color: `#d7f5c4`,
    },
  );
}
