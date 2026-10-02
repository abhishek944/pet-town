/** Creature proximity, petting dispatch, response messages and heart overlays. */
import { hudState } from "../state.js";
import { createHudElement } from "../state/create-hud-element.js";
export function showPetHeartOverlay(position) {
  if (
    !position ||
    (hudState.hudProjectionScratch.copy(position),
    (hudState.hudProjectionScratch.y += 1.2),
    hudState.hudProjectionScratch.project(hudState.hudContext.camera),
    hudState.hudProjectionScratch.z > 1)
  ) {
    return;
  }
  let result =
    ((hudState.hudProjectionScratch.x + 1) / 2) *
    (hudState.hudContext.viewport?.width ?? innerWidth);
  let result2 =
    ((1 - hudState.hudProjectionScratch.y) / 2) *
    (hudState.hudContext.viewport?.height ?? innerHeight);
  for (let index = 0; index < 6; index++) {
    let hudElementResult = createHudElement(
      `<div class="pk-heart">${hudState.hudIcons.heart}</div>`,
    );
    hudElementResult.style.left = result + (Math.random() - 0.5) * 40 + `px`;
    hudElementResult.style.top = result2 + (Math.random() - 0.5) * 20 + `px`;
    hudElementResult.style.setProperty(`--dx`, (Math.random() - 0.5) * 90 + `px`);
    hudElementResult.style.setProperty(`--rot`, (Math.random() - 0.5) * 50 + `deg`);
    hudElementResult.style.animationDelay = index * 70 + `ms`;
    let result3 = 0.7 + Math.random() * 0.6;
    hudElementResult.style.width = hudElementResult.style.height = 26 * result3 + `px`;
    hudState.hudElements.hearts.append(hudElementResult);
    setTimeout(() => hudElementResult.remove(), 1600 + index * 70);
  }
}
