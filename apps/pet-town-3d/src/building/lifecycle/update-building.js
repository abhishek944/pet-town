/** Initialize building, expose extension commands and update the subsystem each frame. */
import { buildingState } from "../state.js";
import { probeTerrainBlockAccess } from "../terrain-adapter/probe-terrain-block-access.js";
import { resolveBuildingPalette } from "../state/resolve-building-palette.js";
import { isBuildingInputBlocked } from "../input/is-building-input-blocked.js";
import { showBuildingToast } from "../block-edits/show-building-toast.js";
import { handleBuildingMouseButton } from "../input/handle-building-mouse-button.js";
import { updateBuildingTarget } from "../targeting/update-building-target.js";
import { updateBuildingGhost } from "../targeting/update-building-ghost.js";
import { updateBlockAnimations } from "../meshes/update-block-animations.js";
import { rebuildBlockSkinMeshes } from "../meshes/rebuild-block-skin-meshes.js";
import { updateBlockDebris } from "../meshes/update-block-debris.js";
import { updatePlacedLanterns } from "../targeting/update-placed-lanterns.js";
export function updateBuilding(deltaTime, context) {
  if (context.terrain !== buildingState.buildingTerrain) {
    buildingState.buildingTerrain = context.terrain;
    buildingState.buildingRuntime.blockAtWorks = probeTerrainBlockAccess();
    resolveBuildingPalette();
  }
  if (
    !buildingState.buildingRuntime.blockAtWorks &&
    context.time - buildingState.buildingRuntime.lastProbe > 1
  ) {
    buildingState.buildingRuntime.lastProbe = context.time;
    buildingState.buildingRuntime.blockAtWorks = probeTerrainBlockAccess();
  }
  if (
    buildingState.worldPersistenceState.toast &&
    !isBuildingInputBlocked() &&
    !buildingState.buildingContext.hud?.bannerActive
  ) {
    buildingState.worldPersistenceState.toast = false;
    showBuildingToast(
      `Welcome back! ${buildingState.worldPersistenceState.restored} of your builds were kept safe`,
      {
        icon: `heart`,
        color: `#ffd6e2`,
      },
    );
  }
  if (
    buildingState.buildingMousePress?.locked &&
    buildingState.buildingMousePress.fired &&
    performance.now() > buildingState.buildingMousePress.next &&
    !isBuildingInputBlocked()
  ) {
    handleBuildingMouseButton(buildingState.buildingMousePress.b);
    buildingState.buildingMousePress.next = performance.now() + 230;
  }
  updateBuildingTarget();
  updateBuildingGhost(deltaTime);
  updateBlockAnimations(deltaTime);
  if (buildingState.blockSkinsDirty) {
    rebuildBlockSkinMeshes();
  }
  updateBlockDebris(deltaTime);
  updatePlacedLanterns(deltaTime);
}
