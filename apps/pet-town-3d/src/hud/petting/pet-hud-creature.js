/** Creature proximity, petting dispatch, response messages and heart overlays. */
import * as THREE from "three";
import { hudState } from "../state.js";
import { getHudEntityPosition } from "./get-hud-entity-position.js";
import { playHudSound } from "../state/play-hud-sound.js";
import { showPetHeartOverlay } from "./show-pet-heart-overlay.js";
import { showPetResponseToast } from "./show-pet-response-toast.js";
export function petHudCreature(creature) {
  if (hudState.hudRuntime.petCooldown > 0) {
    return;
  }
  hudState.hudRuntime.petCooldown = 0.9;
  let enabled = false;
  hudState.hudRuntime.selfPet = true;
  try {
    enabled = !!(
      creature.pet?.(hudState.hudContext) ??
      creature.onPet?.(hudState.hudContext) ??
      hudState.hudContext.petCreature?.(creature) ??
      hudState.hudContext.creatures?.pet?.(creature)
    );
  } catch {}
  hudState.hudRuntime.selfPet = false;
  dispatchEvent(
    new CustomEvent(`pet-town:pet`, {
      detail: {
        creature: creature,
        handled: enabled,
      },
    }),
  );
  let hudEntityPositionResult = getHudEntityPosition(creature);
  if ((playHudSound(`pet`), !enabled)) {
    try {
      hudState.hudContext.fx?.burst?.(
        hudState.hudProjectionScratch.copy(hudEntityPositionResult).add(new THREE.Vector3(0, 1, 0)),
        `hearts`,
      );
    } catch {}
    showPetHeartOverlay(hudEntityPositionResult);
  }
  showPetResponseToast(creature);
}
