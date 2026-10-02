/** Animated edits, placement constraints, undo/redo and block selection. */
import { buildingState } from "../state.js";
import { getBuildingBlockKey } from "../terrain-adapter/get-building-block-key.js";
import { getBuildingBlockState } from "../terrain-adapter/get-building-block-state.js";
import { selectBuildingBlock } from "./select-building-block.js";
import { playBuildingSound } from "../block-edits/play-building-sound.js";
import { showBuildingToast } from "../block-edits/show-building-toast.js";
export function pickTargetBlock() {
  let target2 = buildingState.buildingRuntime.target;
  if (!target2) {
    return;
  }
  let buildingBlockKeyResult = getBuildingBlockKey(
    getBuildingBlockState(target2.x, target2.y, target2.z),
  );
  let indexResult = buildingState.resolvedBuildingPalette.findIndex(
    (availableValue) => availableValue.available && availableValue.key === buildingBlockKeyResult,
  );
  if (indexResult >= 0) {
    selectBuildingBlock(indexResult);
  } else {
    playBuildingSound(`deny`);
    showBuildingToast(`Can't copy that block`, {
      icon: `block`,
      color: `#ffd2c8`,
      sound: false,
    });
  }
}
