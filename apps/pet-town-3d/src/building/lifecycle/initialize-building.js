import { createBuildingApi } from "./create-building-api.js";
/** Initialize building, expose extension commands and update the subsystem each frame. */
import { buildingState } from "../state.js";
import { initializeBuildingMeshes } from "../meshes/initialize-building-meshes.js";
import { resolveBuildingPalette } from "../state/resolve-building-palette.js";
import { bindBuildingInput } from "../input/bind-building-input.js";
import { probeTerrainBlockAccess } from "../terrain-adapter/probe-terrain-block-access.js";
import { blockCoordinateKey } from "../state/block-coordinate-key.js";
import { getWorldTerrainSignature } from "../persistence/get-world-terrain-signature.js";
import { restoreWorldEdits } from "../persistence/restore-world-edits.js";
import { writeSavedValueSynchronously } from "../../persistence/storage/write-saved-value-synchronously.js";
import { createWorldSaveSnapshot } from "../persistence/create-world-save-snapshot.js";
import { selectBuildingBlock } from "../commands/select-building-block.js";
export function initializeBuilding(context) {
  buildingState.buildingContext = context;
  buildingState.buildingTerrain = context.terrain;
  let query = context.params ?? new URLSearchParams(location.search);
  buildingState.buildingRuntime.quiet =
    [`cam`, `camrel`, `nohud`, `noghost`].some((parameter) => query.has(parameter)) &&
    !query.has(`build`);
  initializeBuildingMeshes();
  resolveBuildingPalette();
  bindBuildingInput();
  buildingState.buildingRuntime.blockAtWorks = probeTerrainBlockAccess();
  try {
    buildingState.buildingTerrain?.onChange?.((position) => {
      let coordinateKey = blockCoordinateKey(position.x, position.y, position.z);
      let skinAssignment = buildingState.blockSkinAssignments.get(coordinateKey);
      if (skinAssignment && position.id !== skinAssignment.proxyId) {
        buildingState.blockSkinAssignments.delete(coordinateKey);
        buildingState.blockSkinsDirty = true;
      }
    });
  } catch {}
  if (
    ((buildingState.worldPersistenceState.on =
      ![`cam`, `camrel`, `nopersist`].some((parameter) => query.has(parameter)) &&
      !!buildingState.buildingTerrain?.setBlock &&
      buildingState.buildingRuntime.resolvedFrom === `terrain`),
    (buildingState.worldPersistenceState.sig = getWorldTerrainSignature()),
    buildingState.worldPersistenceState.on)
  ) {
    restoreWorldEdits();
    let saveBeforeLeave = () => {
      if (buildingState.worldPersistenceState.on && buildingState.worldPersistenceState.dirty) {
        writeSavedValueSynchronously(buildingState.worldSaveKey, createWorldSaveSnapshot());
        buildingState.worldPersistenceState.dirty = false;
      }
    };
    addEventListener(`pagehide`, saveBeforeLeave);
    document.addEventListener(`visibilitychange`, () => {
      if (document.hidden) {
        saveBeforeLeave();
      }
    });
  }
  context.building = createBuildingApi();
  selectBuildingBlock(0, true);
}
