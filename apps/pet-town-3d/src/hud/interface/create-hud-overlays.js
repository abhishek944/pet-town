/** Create HUD controls, help, reset confirmation, capture overlays and the block hotbar. */
import { createTownSettings } from "../settings/create-town-settings.js";
import { hudState } from "../state.js";
import { createHudElement } from "../state/create-hud-element.js";
import { toggleHudHelp } from "../modals/toggle-hud-help.js";
import { createTouchControls } from "../touch-controls/create-touch-controls.js";
import { warmPhotoCapture } from "../photo/warm-photo-capture.js";
import { petHudCreature } from "../petting/pet-hud-creature.js";
import { showWorldResetConfirmation } from "../modals/show-world-reset-confirmation.js";
import { confirmWorldReset } from "../modals/confirm-world-reset.js";
import { dismissWorldResetConfirmation } from "../modals/dismiss-world-reset-confirmation.js";
export function createHudOverlays(context) {
  hudState.hudElements.toasts = createHudElement(`<div class="pk-toasts"></div>`);
  hudState.hudElements.banner = createHudElement(
    `<div class="pk-banner"><div class="pk-ribbon"></div><div class="sub"></div></div>`,
  );
  hudState.settingsView = createTownSettings(context, () => toggleHudHelp(false));
  hudState.hudElements.help = hudState.settingsView.root;
  hudState.hudElements.scrim = createHudElement(`<div class="pk-scrim"></div>`);
  hudState.hudElements.scrim.addEventListener(`pointerdown`, (event) => {
    event.stopPropagation();
    event.preventDefault();
    toggleHudHelp(false);
  });
  hudState.hudElements.scrim.addEventListener(`wheel`, (event) => event.stopPropagation(), {
    passive: true,
  });
  hudState.hudRootElement.append(
    hudState.hudElements.banner,
    hudState.hudElements.scrim,
    hudState.hudElements.help,
    hudState.hudElements.toasts,
  );
  hudState.hudRuntime.touch = createTouchControls(context, hudState.hudRootElement);
  let scheduleIdle = window.requestIdleCallback ?? ((callback) => setTimeout(callback, 1));
  setTimeout(
    () =>
      scheduleIdle(
        () => {
          if (!hudState.hudRuntime.photoBusy) {
            warmPhotoCapture();
          }
        },
        {
          timeout: 2e3,
        },
      ),
    1500,
  );
  hudState.hudElements.prompt.addEventListener(`pointerdown`, (event) => {
    event.stopPropagation();
    if (hudState.hudRuntime.near) {
      petHudCreature(hudState.hudRuntime.near);
    }
  });
  hudState.hudElements.help.querySelector(`[data-a=reset]`).addEventListener(`click`, (event) => {
    event.stopPropagation();
    showWorldResetConfirmation();
  });
  hudState.hudElements.help.addEventListener(`pointerdown`, (event) => event.stopPropagation());
  hudState.hudElements.confirm =
    createHudElement(`<div class="pk-confirm"><div class="pk-card stitch box">
    <h3>${hudState.hudIcons.leaf}Start the world over?</h3><p>Every block you placed or broke goes back to how the island began. This can't be undone.</p>
    <div class="btns"><button class="pk-b ghost" data-a="no">Keep my world <span class="pk-kbd">Esc</span></button><button class="pk-b warm" data-a="yes">Reset <span class="pk-kbd">↵</span></button></div></div></div>`);
  hudState.hudElements.confirm.hidden = true;
  hudState.hudElements.confirm.setAttribute("role", "dialog");
  hudState.hudElements.confirm.setAttribute("aria-modal", "true");
  hudState.hudElements.confirm.setAttribute("aria-label", "Reset world confirmation");
  hudState.hudRootElement.append(hudState.hudElements.confirm);
  hudState.hudElements.confirm.addEventListener(`pointerdown`, (event) => event.stopPropagation());
  hudState.hudElements.confirm.addEventListener("keydown", (event) => {
    if (event.code !== "Tab") return;
    const buttons = [...hudState.hudElements.confirm.querySelectorAll("button")];
    event.preventDefault();
    buttons[document.activeElement === buttons[0] ? 1 : 0].focus();
  });
  hudState.hudElements.confirm.addEventListener(`click`, (event) => {
    let action = event.target.closest(`[data-a]`)?.dataset.a;
    if (action === `yes`) {
      confirmWorldReset();
    } else {
      if (action === `no` || event.target === hudState.hudElements.confirm) {
        dismissWorldResetConfirmation();
      }
    }
  });
}
