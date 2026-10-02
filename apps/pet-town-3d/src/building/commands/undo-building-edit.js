/** Animated edits, placement constraints, undo/redo and block selection. */
import { wakeBuildingInteraction } from "../state/wake-building-interaction.js";
import { flushPendingBlockPlacements } from "../meshes/flush-pending-block-placements.js";
import { buildingState } from "../state.js";
import { playBuildingSound } from "../block-edits/play-building-sound.js";
import { animateBuildingBlockChange } from "./animate-building-block-change.js";
export function undoBuildingEdit() {
  if (
    (wakeBuildingInteraction(), flushPendingBlockPlacements(), !buildingState.buildingUndoCount)
  ) {
    playBuildingSound(`deny`);
    return;
  }
  buildingState.buildingUndoCursor =
    (buildingState.buildingUndoCursor - 1 + buildingState.buildingHistoryCapacity) %
    buildingState.buildingHistoryCapacity;
  buildingState.buildingUndoCount--;
  let position = buildingState.buildingUndoHistory[buildingState.buildingUndoCursor];
  buildingState.buildingUndoHistory[buildingState.buildingUndoCursor] = undefined;
  animateBuildingBlockChange(position.x, position.y, position.z, position.prev);
  buildingState.buildingRedoHistory.push(position);
  playBuildingSound(`undo`);
}
