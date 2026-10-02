/** Create HUD controls, help, reset confirmation, capture overlays and the block hotbar. */
import { hudState } from "../state.js";
import { buildingState } from "../../building/state.js";
import { createHudElement } from "../state/create-hud-element.js";
import { createBlockIconCanvas } from "../../building/icons/create-block-icon-canvas.js";
export function rebuildHudHotbar() {
  hudState.hudElements.hotbar.innerHTML = ``;
  hudState.hudElements.slots = [];
  hudState.hudRuntime.lastSel = -1;
  hudState.hudRuntime.hbVersion = hudState.hudContext.building?.version;
  hudState.hudRuntime.hbKey = ``;
  let result = hudState.hudContext.building?.palette ?? buildingState.buildingPaletteDefinitions;
  let values = [`1`, `2`, `3`, `4`, `5`, `6`, `7`, `8`, `9`, `0`, `-`, `=`];
  result.forEach((availableValue, value) => {
    let hudElementResult = createHudElement(
      `<button type="button" class="pk-slot${availableValue.available === false ? ` off` : ``}" title="${availableValue.name}"><span class="n">${values[value] ?? ``}</span></button>`,
    );
    hudElementResult.setAttribute("aria-label", availableValue.name);
    let result2 = (hudState.hudContext.building?.icon ?? createBlockIconCanvas)(
      availableValue.key,
      128,
    );
    hudElementResult.prepend(result2);
    hudState.hudElements.hotbar.append(hudElementResult);
    hudState.hudElements.slots.push(hudElementResult);
    hudElementResult.style.pointerEvents = `auto`;
    hudElementResult.style.cursor = `pointer`;
    hudElementResult.addEventListener(`pointerdown`, (stopPropagationValue) => {
      stopPropagationValue.stopPropagation();
      hudState.hudContext.building?.select?.(value);
    });
    hudElementResult.addEventListener("click", (event) => {
      if (event.detail === 0) hudState.hudContext.building?.select?.(value);
      else hudElementResult.blur();
    });
  });
}
