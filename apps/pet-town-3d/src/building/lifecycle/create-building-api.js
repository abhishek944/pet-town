/** Initialize building, expose extension commands and update the subsystem each frame. */
import { buildingState } from "../state.js";
import { resolveBuildingPalette } from "../state/resolve-building-palette.js";
import { probeTerrainBlockAccess } from "../terrain-adapter/probe-terrain-block-access.js";
import { selectBuildingBlock } from "../commands/select-building-block.js";
import { undoBuildingEdit } from "../commands/undo-building-edit.js";
import { redoBuildingEdit } from "../commands/redo-building-edit.js";
import { breakTargetBlock } from "../commands/break-target-block.js";
import { placeSelectedBlock } from "../commands/place-selected-block.js";
import { pickTargetBlock } from "../commands/pick-target-block.js";
import { isBuildingPointerLocked } from "../input/is-building-pointer-locked.js";
import { wakeBuildingInteraction } from "../state/wake-building-interaction.js";
import { resetWorldEdits } from "../persistence/reset-world-edits.js";
import { saveWorldEdits } from "../persistence/save-world-edits.js";
import { getBuildingBlockKey } from "../terrain-adapter/get-building-block-key.js";
import { getBuildingBlockState } from "../terrain-adapter/get-building-block-state.js";
import { getBlockFootstepSurface } from "../commands/get-block-footstep-surface.js";
import { readTerrainBlock } from "../terrain-adapter/read-terrain-block.js";
import { isBuildingBlockSolid } from "../terrain-adapter/is-building-block-solid.js";
import { createBlockFaceCanvas } from "../icons/create-block-face-canvas.js";
import { createBlockIconCanvas } from "../icons/create-block-icon-canvas.js";
import { placeBlockAt, breakBlockAt } from "./edit-block-at.js";
export function createBuildingApi() {
  return {
    palette: buildingState.resolvedBuildingPalette,
    select: selectBuildingBlock,
    undo: undoBuildingEdit,
    redo: redoBuildingEdit,
    breakTarget: breakTargetBlock,
    placeSelected: placeSelectedBlock,
    pick: pickTargetBlock,
    get selected() {
      return buildingState.buildingRuntime.selected;
    },
    set selected(index) {
      selectBuildingBlock(index, true);
    },
    get block() {
      return buildingState.resolvedBuildingPalette[buildingState.buildingRuntime.selected];
    },
    get target() {
      return buildingState.buildingRuntime.target;
    },
    get place() {
      return buildingState.buildingRuntime.place;
    },
    get canPlace() {
      return buildingState.buildingRuntime.canPlace;
    },
    get aim() {
      return buildingState.buildingRuntime.aim;
    },
    get creature() {
      return buildingState.buildingRuntime.creature;
    },
    get mode() {
      return isBuildingPointerLocked()
        ? `locked`
        : buildingState.buildingRuntime.usingCursor
          ? `cursor`
          : `front`;
    },
    get selectedAt() {
      return buildingState.buildingRuntime.selectT;
    },
    get version() {
      return buildingState.buildingRuntime.version;
    },
    get active() {
      return performance.now() < buildingState.buildingRuntime.activeUntil;
    },
    get lastInputAt() {
      return buildingState.buildingRuntime.lastInputAt;
    },
    wake: wakeBuildingInteraction,
    get enabled() {
      return buildingState.buildingRuntime.enabled;
    },
    set enabled(enabled) {
      buildingState.buildingRuntime.enabled = !!enabled;
    },
    get wheelMode() {
      return buildingState.buildingRuntime.wheelMode;
    },
    set wheelMode(mode) {
      buildingState.buildingRuntime.wheelMode = mode === `always` ? `always` : `modifier`;
    },
    get undoCount() {
      return buildingState.buildingUndoCount;
    },
    get redoCount() {
      return buildingState.buildingRedoHistory.length;
    },
    get resolvedFrom() {
      return buildingState.buildingRuntime.resolvedFrom;
    },
    skins: buildingState.blockSkinAssignments,
    resetWorld: resetWorldEdits,
    get persistence() {
      return {
        on: buildingState.worldPersistenceState.on,
        loaded: buildingState.worldPersistenceState.loaded,
        restored: buildingState.worldPersistenceState.restored,
        edits: buildingState.worldPersistenceState.edits.size,
      };
    },
    saveNow: saveWorldEdits,
    _debug: () => ({
      cubes: buildingState.blockDebrisParticles.length,
      drawn: buildingState.blockDebrisMesh.count,
      anims: buildingState.blockAnimationInstances.length,
      pending: buildingState.pendingBlockPlacements.length,
      lamps: buildingState.placedLanternLights.map((light) => +light.intensity.toFixed(2)),
    }),
    keyAt: (x, y, z) =>
      getBuildingBlockKey(getBuildingBlockState(Math.floor(x), Math.floor(y), Math.floor(z))),
    surfaceAt(x, y, z) {
      let key = this.keyAt(x, y, z);
      return key ? getBlockFootstepSurface(key) : null;
    },
    keyForId: (id) => buildingState.buildingRuntime.idToKey.get(id) ?? null,
    idForKey: (key) =>
      buildingState.resolvedBuildingPalette.find((block) => block.key === key)?.resolvedId ?? null,
    surfaceFor: getBlockFootstepSurface,
    blockAt: readTerrainBlock,
    solidAt: (x, y, z) => isBuildingBlockSolid(x, y, z),
    faceCanvas: createBlockFaceCanvas,
    icon: (key, size = 128) => createBlockIconCanvas(key, size),
    refresh() {
      buildingState.buildingTerrain = buildingState.buildingContext.terrain;
      buildingState.buildingRuntime.blockAtWorks = probeTerrainBlockAccess();
      resolveBuildingPalette();
    },
    placeAt: placeBlockAt,
    breakAt: breakBlockAt,
  };
}
