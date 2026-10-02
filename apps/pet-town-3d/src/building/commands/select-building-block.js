/** Animated edits, placement constraints, undo/redo and block selection. */
import { buildingState } from "../state.js";
import { createBlockMaterials } from "../materials/create-block-materials.js";
import { playBuildingSound } from "../block-edits/play-building-sound.js";
import { wakeBuildingInteraction } from "../state/wake-building-interaction.js";
export function selectBuildingBlock(index, silent = false) {
  let length2 = buildingState.resolvedBuildingPalette.length;
  index = ((Math.round(index) % length2) + length2) % length2;
  buildingState.buildingRuntime.selected = index;
  buildingState.buildingRuntime.selectT = performance.now();
  if (buildingState.placementGhostMesh) {
    buildingState.placementGhostMesh.material = createBlockMaterials(
      buildingState.resolvedBuildingPalette[index].key,
      {
        ghost: true,
      },
    );
  }
  if (!silent) {
    playBuildingSound(`select`, {
      index: index,
    });
    wakeBuildingInteraction();
  }
}
