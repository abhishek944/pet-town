/** Create HUD controls, help, reset confirmation, capture overlays and the block hotbar. */

import { hudState } from "../state.js";
import { createHudElement } from "../state/create-hud-element.js";
import { rebuildHudHotbar } from "./rebuild-hud-hotbar.js";
export function createHudInteractionControls() {
  hudState.hudElements.ret = createHudElement(
    `<div class="pk-reticle"><i class="pk-rring"></i><i class="pk-rdot"></i><i class="pk-rc a"></i><i class="pk-rc b"></i><i class="pk-rc c"></i><i class="pk-rc d"></i><span class="pk-rheart">${hudState.hudIcons.heart}</span></div>`,
  );
  hudState.hudElements.prompt = createHudElement(
    `<div class="pk-prompt"><span class="pk-kbd">F</span><span class="lbl">Pet</span><b></b>${hudState.hudIcons.heart}</div>`,
  );
  hudState.hudRootElement.append(hudState.hudElements.ret, hudState.hudElements.prompt);
  hudState.hudElements.bottom = createHudElement(
    `<div class="pk-bottom"><div class="pk-chip pk-blockname"><i class="sw"></i><span class="nm"></span></div><div class="pk-card pk-hotbar"></div></div>`,
  );
  hudState.hudRootElement.append(hudState.hudElements.bottom);
  hudState.hudElements.hotbar = hudState.hudElements.bottom.querySelector(`.pk-hotbar`);
  hudState.hudElements.bname = hudState.hudElements.bottom.querySelector(`.pk-blockname`);
  hudState.hudElements.hotbar.style.pointerEvents = `auto`;
  hudState.hudElements.hotbar.addEventListener(`pointerenter`, () => {
    hudState.hudRuntime.hbHover = true;
  });
  hudState.hudElements.hotbar.addEventListener(`pointerleave`, () => {
    hudState.hudRuntime.hbHover = false;
  });
  hudState.hudElements.hotbar.addEventListener("keydown", (event) => {
    if (["Space", "Enter"].includes(event.code)) event.stopPropagation();
  });
  let wheelDelta = 0;
  hudState.hudElements.hotbar.addEventListener(
    `wheel`,
    (event) => {
      event.preventDefault();
      wheelDelta += event.deltaY || event.deltaX;
      let threshold = Math.abs(event.deltaY || event.deltaX) >= 50 ? 50 : 100;
      for (; Math.abs(wheelDelta) >= threshold;) {
        hudState.hudContext.building?.select?.(
          hudState.hudContext.building.selected + Math.sign(wheelDelta),
        );
        wheelDelta -= Math.sign(wheelDelta) * threshold;
      }
    },
    {
      passive: false,
    },
  );
  rebuildHudHotbar();
}
