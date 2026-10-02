/** Creature proximity, petting dispatch, response messages and heart overlays. */
import { getCreatureDisplayName } from "./get-creature-display-name.js";
import { hudState } from "../state.js";
import { showHudToast } from "../notifications/show-hud-toast.js";
export function showPetResponseToast(creature) {
  let creatureDisplayNameResult = getCreatureDisplayName(creature);
  let result = performance.now();
  if (result - (hudState.hudRuntime.lastPetToast ?? 0) < 1500) {
    return;
  }
  hudState.hudRuntime.lastPetToast = result;
  let values = [
    `${creatureDisplayNameResult} looks so happy!`,
    `${creatureDisplayNameResult} nuzzles you back`,
    `${creatureDisplayNameResult} does a little happy hop`,
    `You and ${creatureDisplayNameResult} are getting close`,
  ];
  showHudToast(values[(Math.random() * values.length) | 0], {
    icon: `heart`,
    color: `#ffd6e2`,
    sound: false,
  });
}
