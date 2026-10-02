/** Animated edits, placement constraints, undo/redo and block selection. */
import * as THREE from "three";
import { buildingState } from "../state.js";
import { playBuildingSound } from "../block-edits/play-building-sound.js";
import { triggerPlacementDeniedShake } from "./trigger-placement-denied-shake.js";
import { getBuildingBlockState } from "../terrain-adapter/get-building-block-state.js";
import { recordBuildingUndo } from "./record-building-undo.js";
import { animateBuildingBlockChange } from "./animate-building-block-change.js";
import { emitBlockDebris } from "../meshes/emit-block-debris.js";
import { getBlockFootstepSurface } from "./get-block-footstep-surface.js";
import { setPlacementGhostScale } from "./set-placement-ghost-scale.js";
export function breakTargetBlock() {
  let target2 = buildingState.buildingRuntime.target;
  if (!target2) {
    playBuildingSound(`deny`);
    return false;
  }
  if (target2.y <= 0) {
    playBuildingSound(`deny`);
    triggerPlacementDeniedShake();
    return false;
  }
  let buildingBlockStateResult = getBuildingBlockState(target2.x, target2.y, target2.z);
  recordBuildingUndo({
    x: target2.x,
    y: target2.y,
    z: target2.z,
    prev: buildingBlockStateResult,
    next: {
      id: buildingState.buildingRuntime.airId,
      skin: null,
    },
  });
  let animateBuildingBlockChangeResult = animateBuildingBlockChange(
    target2.x,
    target2.y,
    target2.z,
    {
      id: buildingState.buildingRuntime.airId,
      skin: null,
    },
  );
  let Result = buildingState.resolvedBuildingPalette.find(
    (keyValue) => keyValue.key === animateBuildingBlockChangeResult,
  );
  let result = Array.isArray(buildingState.buildingTerrain?.blocks)
    ? buildingState.buildingTerrain.blocks[buildingBlockStateResult.id]
    : null;
  let result2 =
    Result?.dust ??
    (result?.color == null ? `#a9774a` : `#` + result.color.toString(16).padStart(6, `0`));
  emitBlockDebris(
    target2.x,
    target2.y,
    target2.z,
    [result2, Result?.colors?.side ?? result2, Result?.colors?.top ?? result2],
    14,
  );
  try {
    buildingState.buildingContext.fx?.burst?.(
      new THREE.Vector3(target2.x + 0.5, target2.y + 0.5, target2.z + 0.5),
      `dust`,
      {
        color: result2,
        count: 10,
      },
    );
  } catch {}
  playBuildingSound(`break`, {
    key: animateBuildingBlockChangeResult,
    surface: getBlockFootstepSurface(animateBuildingBlockChangeResult),
  });
  setPlacementGhostScale(0.85);
  buildingState.buildingRuntime.target = null;
  return true;
}
