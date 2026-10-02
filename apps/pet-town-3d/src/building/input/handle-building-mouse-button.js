/** Input guards, cursor art and desktop/touch building event bindings. */
import { isBuildingInputBlocked } from "./is-building-input-blocked.js";
import { buildingState } from "../state.js";
import { wakeBuildingInteraction } from "../state/wake-building-interaction.js";
import { breakTargetBlock } from "../commands/break-target-block.js";
import { placeSelectedBlock } from "../commands/place-selected-block.js";
import { pickTargetBlock } from "../commands/pick-target-block.js";
export function handleBuildingMouseButton(button) {
  if (!(
    isBuildingInputBlocked() ||
    (buildingState.buildingRuntime.creature && button === 0) ||
    (buildingState.buildingContext.lastCreatureClick &&
      (buildingState.buildingContext.time ?? 0) -
        buildingState.buildingContext.lastCreatureClick.time <
        0.5)
  )) {
    wakeBuildingInteraction();
    if (button === 0) {
      breakTargetBlock();
    } else {
      if (button === 2) {
        placeSelectedBlock();
      } else {
        if (button === 1) {
          pickTargetBlock();
        }
      }
    }
  }
}
