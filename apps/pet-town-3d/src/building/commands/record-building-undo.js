/** Animated edits, placement constraints, undo/redo and block selection. */
import { buildingState } from "../state.js";
export function recordBuildingUndo(edit) {
  buildingState.buildingUndoHistory[buildingState.buildingUndoCursor] = edit;
  buildingState.buildingUndoCursor =
    (buildingState.buildingUndoCursor + 1) % buildingState.buildingHistoryCapacity;
  buildingState.buildingUndoCount = Math.min(
    buildingState.buildingHistoryCapacity,
    buildingState.buildingUndoCount + 1,
  );
  buildingState.buildingRedoHistory.length = 0;
}
