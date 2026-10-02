import { isGameInputCaptured } from "../../core/input-capture.js";
/** Public HUD API, keyboard hooks and update loop. */
import { hudState } from "../state.js";
import { createHudInterface } from "../interface/create-hud-interface.js";
import { showPetResponseToast } from "../petting/show-pet-response-toast.js";
import { confirmWorldReset } from "../modals/confirm-world-reset.js";
import { dismissWorldResetConfirmation } from "../modals/dismiss-world-reset-confirmation.js";
import { showWorldResetConfirmation } from "../modals/show-world-reset-confirmation.js";
import { toggleHudHelp } from "../modals/toggle-hud-help.js";
import { requestPhotoCapture } from "../photo/request-photo-capture.js";
import { petHudCreature } from "../petting/pet-hud-creature.js";
export function initializeHud(context) {
  hudState.hudContext = context;
  hudState.hudRuntime.title = context.gameTitle ?? `Pet Town`;
  createHudInterface(context);
  context.hud = hudState.hudApi;
  addEventListener(`creature:pet`, (detailValue) => {
    if (!hudState.hudRuntime.selfPet && detailValue.detail?.creature) {
      showPetResponseToast(detailValue.detail.creature);
    }
  });
  addEventListener(`keydown`, (event) => {
    if (isGameInputCaptured(context, event)) return;
    if (
      !(event.repeat || event.ctrlKey || event.metaKey || event.altKey) &&
      !hudState.hudRuntime.splash
    ) {
      if (hudState.hudRuntime.confirm) {
        if (event.code !== `Escape` && event.target?.closest?.("button")) return;
        if (event.code === `Enter` || event.code === `NumpadEnter`) {
          confirmWorldReset();
        } else {
          if (event.code === `Escape`) {
            dismissWorldResetConfirmation();
          }
        }
        event.preventDefault();
        return;
      }
      if (
        event.shiftKey &&
        (event.code === `Delete` || event.code === `Backspace`) &&
        hudState.hudRuntime.help
      ) {
        event.preventDefault();
        showWorldResetConfirmation();
        return;
      }
      if (event.target?.closest?.("input,select,textarea,[contenteditable=true]")) return;
      if (event.code === `KeyH`) {
        toggleHudHelp();
      } else {
        if (event.code === `Escape` && hudState.hudRuntime.help) {
          toggleHudHelp(false);
        } else {
          if (event.code === `KeyP`) {
            requestPhotoCapture();
          } else {
            if (event.code === `KeyF` && hudState.hudRuntime.near) {
              petHudCreature(hudState.hudRuntime.near);
            }
          }
        }
      }
    }
  });
}
