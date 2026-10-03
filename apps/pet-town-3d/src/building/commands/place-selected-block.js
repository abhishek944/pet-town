/** Animated edits, placement constraints, undo/redo and block selection. */
import * as THREE from "three";
import { buildingState } from "../state.js";
import { playBuildingSound } from "../block-edits/play-building-sound.js";
import { showBuildingToast } from "../block-edits/show-building-toast.js";
import { triggerPlacementDeniedShake } from "./trigger-placement-denied-shake.js";
import { recordBuildingUndo } from "./record-building-undo.js";
import { getBuildingBlockState } from "../terrain-adapter/get-building-block-state.js";
import { animateBuildingBlockChange } from "./animate-building-block-change.js";
import { emitBlockDebris } from "../meshes/emit-block-debris.js";
import { setPlacementGhostScale } from "./set-placement-ghost-scale.js";
import { isBuildingInputBlocked } from "../input/is-building-input-blocked.js";
export function placeSelectedBlock() {
  if (isBuildingInputBlocked()) return false;
  let place2 = buildingState.buildingRuntime.place;
  let result = buildingState.resolvedBuildingPalette[buildingState.buildingRuntime.selected];
  if (!buildingState.buildingRuntime.target || !place2) {
    playBuildingSound(`deny`);
    return false;
  }
  if (!result.available) {
    playBuildingSound(`deny`);
    showBuildingToast(`${result.name} isn't in this world yet`, {
      icon: `block`,
      color: `#ffd2c8`,
    });
    return false;
  }
  if (!buildingState.buildingRuntime.canPlace) {
    playBuildingSound(`deny`);
    triggerPlacementDeniedShake();
    return false;
  }
  let options = {
    id: result.resolvedId,
    skin: result.skin,
  };
  recordBuildingUndo({
    x: place2.x,
    y: place2.y,
    z: place2.z,
    prev: getBuildingBlockState(place2.x, place2.y, place2.z),
    next: options,
  });
  animateBuildingBlockChange(place2.x, place2.y, place2.z, options);
  emitBlockDebris(place2.x, place2.y - 0.45, place2.z, [`#fff8e6`, result.dust], 6, 0.45);
  try {
    buildingState.buildingContext.fx?.burst?.(
      new THREE.Vector3(place2.x + 0.5, place2.y + 0.15, place2.z + 0.5),
      `sparkle`,
      {
        color: result.dust,
        count: 6,
      },
    );
  } catch {}
  playBuildingSound(`place`, {
    key: result.key,
    surface: result.surface,
  });
  setPlacementGhostScale(1.12);
  return true;
}
