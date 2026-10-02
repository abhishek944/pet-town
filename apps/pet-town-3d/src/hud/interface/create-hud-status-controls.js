/** Create HUD controls, help, reset confirmation, capture overlays and the block hotbar. */

import { hudState } from "../state.js";
import { createHudElement } from "../state/create-hud-element.js";
import { showHudToast } from "../notifications/show-hud-toast.js";
export function createHudStatusControls() {
  hudState.hudElements.tl = createHudElement(`<div class="pk-tl">
    <div class="pk-card pk-clock">
      <div class="pk-dial"><div class="pk-dial-sky"></div><div class="pk-dial-stars"></div><div class="pk-orb"></div><div class="pk-hill2"></div><div class="pk-hill"></div><div class="pk-tree"></div></div>
      <div class="pk-clock-txt"><div class="pk-period">Morning</div><div class="pk-time"><b>9:36</b><small>AM</small></div>
    <div class="pk-chip pk-weather"><span class="wx"></span><span class="wl">Sunny</span><i class="sep"></i><span class="day">Day 1</span></div></div></div>
  </div>`);
  hudState.hudRootElement.append(hudState.hudElements.tl);
  hudState.hudElements.dial = hudState.hudElements.tl.querySelector(`.pk-dial`);
  hudState.hudElements.sky = hudState.hudElements.tl.querySelector(`.pk-dial-sky`);
  hudState.hudElements.stars = hudState.hudElements.tl.querySelector(`.pk-dial-stars`);
  hudState.hudElements.orb = hudState.hudElements.tl.querySelector(`.pk-orb`);
  hudState.hudElements.period = hudState.hudElements.tl.querySelector(`.pk-period`);
  hudState.hudElements.time = hudState.hudElements.tl.querySelector(`.pk-time b`);
  hudState.hudElements.ampm = hudState.hudElements.tl.querySelector(`.pk-time small`);
  hudState.hudElements.wx = hudState.hudElements.tl.querySelector(`.wx`);
  hudState.hudElements.wl = hudState.hudElements.tl.querySelector(`.wl`);
  hudState.hudElements.day = hudState.hudElements.tl.querySelector(`.day`);
  hudState.hudElements.tr = createHudElement(`<div class="pk-tr">
    <button type="button" class="pk-btn" data-a="photo" title="Photo (P)" aria-label="Take photo (P)">${hudState.hudIcons.camera}<span class="pk-kbd">P</span></button>
    <button type="button" class="pk-btn" data-a="sound" title="World sound (M)" aria-label="World sound (M)">${hudState.hudIcons.sound}<span class="pk-kbd">M</span></button>
    <button type="button" class="pk-btn" data-a="help" title="Town settings (H)" aria-label="Town settings (H)">${hudState.hudIcons.help}<span class="pk-kbd">H</span></button>
  </div>`);
  hudState.hudRootElement.append(hudState.hudElements.tr);
  hudState.hudElements.snd = hudState.hudElements.tr.querySelector(`[data-a=sound]`);
  hudState.hudElements.helpBtn = hudState.hudElements.tr.querySelector(`[data-a=help]`);
  hudState.hudElements.tr.addEventListener(`click`, (event) => {
    let action = event.target.closest(`.pk-btn`)?.dataset.a;
    if (action) {
      if (action === `photo`) {
        hudState.hudApi.photo();
      } else {
        if (action === `help`) {
          hudState.hudApi.toggleHelp();
        } else {
          if (action === `sound`) {
            if (hudState.hudContext.audio?.toggleMute) {
              hudState.hudContext.audio.toggleMute();
            } else {
              showHudToast(`Sound is still waking up`, {
                icon: `sound`,
              });
            }
          }
        }
      }
    }
  });
  hudState.hudElements.tr.addEventListener("keydown", (event) => {
    if (["Space", "Enter"].includes(event.code)) event.stopPropagation();
  });
  for (let button of hudState.hudElements.tr.children) {
    button.addEventListener(`pointerdown`, (event) => event.stopPropagation());
  }
}
