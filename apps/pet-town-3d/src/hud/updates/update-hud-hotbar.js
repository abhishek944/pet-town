/** Clock, weather, hotbar, targeting reticle and interaction prompts. */
import { hudState } from "../state.js";
import { rebuildHudHotbar } from "../interface/rebuild-hud-hotbar.js";
export function updateHudHotbar() {
  let building2 = hudState.hudContext.building;
  if (!building2) {
    return;
  }
  if (
    hudState.hudElements.slots.length !== building2.palette.length ||
    building2.version !== hudState.hudRuntime.hbVersion
  ) {
    let result6 = hudState.hudRuntime.lastSel < 0;
    rebuildHudHotbar();
    if (!result6) {
      hudState.hudRuntime.lastSel = -2;
    }
  }
  let selected2 = building2.selected;
  if (selected2 !== hudState.hudRuntime.lastSel) {
    hudState.hudElements.slots[hudState.hudRuntime.lastSel]?.classList.remove(`sel`, `hop`);
    let result7 = hudState.hudElements.slots[selected2];
    result7?.classList.add(`sel`);
    result7?.classList.remove(`hop`);
    result7?.offsetWidth;
    result7?.classList.add(`hop`);
    let result8 = building2.palette[selected2];
    hudState.hudElements.bname.querySelector(`.nm`).textContent =
      result8.name + (result8.available === false ? ` (unavailable)` : ``);
    hudState.hudElements.bname.querySelector(`.sw`).style.background =
      result8.colors?.top ?? result8.dust;
    if (hudState.hudRuntime.lastSel >= 0 || hudState.hudRuntime.lastSel === -2) {
      hudState.hudElements.bname.classList.add(`show`);
      hudState.hudRuntime.nameTimer = 1.8;
    }
    hudState.hudRuntime.lastSel = selected2;
  }
  hudState.hudElements.slots.forEach((slot, index) => {
    slot.classList.toggle(`off`, building2.palette[index].available === false);
    slot.setAttribute("aria-pressed", String(index === selected2));
  });
}
