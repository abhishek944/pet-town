/** Animated edits, placement constraints, undo/redo and block selection. */
import { wakeBuildingInteraction } from "../state/wake-building-interaction.js";
import { flushPendingBlockPlacements } from "../meshes/flush-pending-block-placements.js";
import { buildingState } from "../state.js";
import { playBuildingSound } from "../block-edits/play-building-sound.js";
import { animateBuildingBlockChange } from "./animate-building-block-change.js";
export function redoBuildingEdit() {
  wakeBuildingInteraction();
  flushPendingBlockPlacements();
  let position = buildingState.buildingRedoHistory.pop();
  if (!position) {
    playBuildingSound(`deny`);
    return;
  }
  animateBuildingBlockChange(position.x, position.y, position.z, position.next);
  buildingState.buildingUndoHistory[buildingState.buildingUndoCursor] = position;
  buildingState.buildingUndoCursor =
    (buildingState.buildingUndoCursor + 1) % buildingState.buildingHistoryCapacity;
  buildingState.buildingUndoCount = Math.min(
    buildingState.buildingHistoryCapacity,
    buildingState.buildingUndoCount + 1,
  );
  playBuildingSound(`redo`);
}
