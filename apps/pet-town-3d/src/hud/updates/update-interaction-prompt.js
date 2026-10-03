/** Clock, weather, hotbar, targeting reticle and interaction prompts. */
import { hudState } from "../state.js";
import { findPettableCreature } from "../petting/find-pettable-creature.js";
import { getCreatureDisplayName } from "../petting/get-creature-display-name.js";
import { getHudEntityPosition } from "../petting/get-hud-entity-position.js";
export function updateInteractionPrompt(deltaTime) {
  hudState.hudRuntime.petCooldown = Math.max(0, hudState.hudRuntime.petCooldown - deltaTime);
  if (hudState.hudContext.boats?.hasAction) {
    hudState.hudRuntime.near = null;
    hudState.hudElements.prompt.classList.remove("show");
    return;
  }
  hudState.hudRuntime.near =
    hudState.hudRuntime.splash ||
    hudState.hudRuntime.help ||
    hudState.hudRuntime.confirm ||
    hudState.hudApi.bannerActive
      ? null
      : findPettableCreature();
  let result = null;
  if (hudState.hudRuntime.near) {
    result = {
      key: `F`,
      label: `Pet`,
      name: getCreatureDisplayName(hudState.hudRuntime.near),
      anchor: getHudEntityPosition(hudState.hudRuntime.near),
      lift:
        (hudState.hudRuntime.near.def?.height ?? 1) * (hudState.hudRuntime.near.size ?? 1) + 0.35,
    };
  } else {
    for (let result2 of hudState.hudRuntime.prompts.values()) {
      result = result2;
    }
  }
  if ((hudState.hudElements.prompt.classList.toggle(`show`, !!result), result)) {
    let innerWidthValue = hudState.hudContext.viewport?.width ?? innerWidth;
    let innerHeightValue = hudState.hudContext.viewport?.height ?? innerHeight;
    let result3 = performance.now();
    if (!hudState.hudRuntime.promptBox || result3 - hudState.hudRuntime.promptBox.t > 500) {
      let boundingClientRectResult = hudState.hudElements.hotbar.getBoundingClientRect();
      hudState.hudRuntime.promptBox = {
        t: result3,
        w: hudState.hudElements.prompt.offsetWidth || 180,
        h: hudState.hudElements.prompt.offsetHeight || 46,
        hbTop: boundingClientRectResult.height
          ? boundingClientRectResult.top
          : innerHeightValue - 100,
      };
    }
    let { w: promptBox2, h: promptBox3, hbTop: promptBox4 } = hudState.hudRuntime.promptBox;
    let result4 = Math.max(0.08 * innerWidthValue, promptBox2 / 2 + 8);
    let result5 = Math.min(0.92 * innerWidthValue, innerWidthValue - promptBox2 / 2 - 8);
    let result6 = 0.16 * innerHeightValue + 46;
    let result7 = promptBox4 - 40;
    let result8 = innerWidthValue / 2;
    let result9 = innerHeightValue / 2 + 60;
    let enabled = false;
    if (
      result.anchor &&
      (hudState.hudProjectionScratch.copy(result.anchor),
      (hudState.hudProjectionScratch.y += result.lift ?? 1.2),
      hudState.hudProjectionScratch.project(hudState.hudContext.camera),
      hudState.hudProjectionScratch.z < 1)
    ) {
      result8 = ((hudState.hudProjectionScratch.x + 1) / 2) * innerWidthValue;
      result9 = ((1 - hudState.hudProjectionScratch.y) / 2) * innerHeightValue;
      enabled = true;
      let head2 = hudState.hudContext.player?.head;
      if (head2) {
        hudState.hudProjectionScratch.copy(head2).project(hudState.hudContext.camera);
        let result12 = ((hudState.hudProjectionScratch.x + 1) / 2) * innerWidthValue;
        let result13 = ((1 - hudState.hudProjectionScratch.y) / 2) * innerHeightValue;
        hudState.hudProjectionScratch.copy(head2);
        hudState.hudProjectionScratch.y += 0.6;
        hudState.hudProjectionScratch.project(hudState.hudContext.camera);
        let result14 = ((1 - hudState.hudProjectionScratch.y) / 2) * innerHeightValue;
        let result15 = result9 - promptBox3 / 2;
        if (
          Math.abs(result12 - result8) < promptBox2 / 2 + 30 &&
          result15 > result14 - promptBox3 - 20 &&
          result15 < result13 + 70
        ) {
          result9 = Math.min(result9 - 90, result14 - 16);
        }
      }
    }
    result8 = Math.min(result5, Math.max(result4, result8));
    result9 = Math.min(Math.max(result6, result7), Math.max(result6, result9));
    let result10 = hudState.hudRuntime.promptX == null ? 1 : 1 - Math.exp(-deltaTime * 16);
    hudState.hudRuntime.promptX =
      hudState.hudRuntime.promptX == null
        ? result8
        : hudState.hudRuntime.promptX + (result8 - hudState.hudRuntime.promptX) * result10;
    hudState.hudRuntime.promptY =
      hudState.hudRuntime.promptY == null
        ? result9
        : hudState.hudRuntime.promptY + (result9 - hudState.hudRuntime.promptY) * result10;
    hudState.hudElements.prompt.style.left = hudState.hudRuntime.promptX.toFixed(1) + `px`;
    hudState.hudElements.prompt.style.top = hudState.hudRuntime.promptY.toFixed(1) + `px`;
    hudState.hudElements.prompt.classList.toggle(`tail`, enabled);
    let element = hudState.hudElements.prompt.querySelector(`.pk-kbd`);
    let element2 = hudState.hudElements.prompt.querySelector(`.lbl`);
    let element3 = hudState.hudElements.prompt.querySelector(`b`);
    if (element.textContent !== result.key) {
      element.textContent = result.key;
    }
    if (element2.textContent !== result.label) {
      element2.textContent = result.label;
    }
    let result11 = result.name ?? ``;
    if (element3.textContent !== result11) {
      element3.textContent = result11;
    }
  }
}
