/** Building API module, hotbar state, history queues, skin assignments and terrain resolution. */
import * as THREE from "three";
import { buildingState } from "../state.js";
import { initializeBuilding } from "../lifecycle/initialize-building.js";
import { createBlockFaceCanvas } from "../icons/create-block-face-canvas.js";
import { createBlockIconCanvas } from "../icons/create-block-icon-canvas.js";
import { updateBuilding } from "../lifecycle/update-building.js";
export function prepareBuildingState() {
  buildingState.buildingModule = {
    get BLOCK_IDS() {
      return buildingState.buildingBlockIds;
    },
    get PALETTE() {
      return buildingState.buildingPaletteDefinitions;
    },
    get init() {
      return initializeBuilding;
    },
    get makeFaceCanvas() {
      return createBlockFaceCanvas;
    },
    get makeIcon() {
      return createBlockIconCanvas;
    },
    get update() {
      return updateBuilding;
    },
  };
  buildingState.maximumBuildingReach = 9;
  buildingState.buildingHistoryCapacity = 128;
  buildingState.buildingHotbarKeyCodes = [
    `Digit1`,
    `Digit2`,
    `Digit3`,
    `Digit4`,
    `Digit5`,
    `Digit6`,
    `Digit7`,
    `Digit8`,
    `Digit9`,
    `Digit0`,
    `Minus`,
    `Equal`,
  ];
  buildingState.resolvedBuildingPalette = buildingState.buildingPaletteDefinitions.map(
    (idValue) => ({
      ...idValue,
      resolvedId: idValue.id,
      available: true,
      native: true,
      skin: null,
      source: `default`,
    }),
  );
  buildingState.buildingRuntime = {
    selected: 0,
    selectT: 0,
    target: null,
    place: null,
    canPlace: false,
    enabled: true,
    version: 0,
    mode: `front`,
    mouseNDC: new THREE.Vector2(),
    mouseSeen: false,
    aim: {
      x: 0,
      y: 0,
      visible: false,
    },
    airId: 0,
    nonSolid: new Set(),
    idToKey: new Map(),
    blockAtWorks: false,
    lastProbe: -1,
    resolvedFrom: `none`,
    wheelMode: `modifier`,
    cursor: ``,
    activeUntil: 0,
    lastInputAt: 0,
    fade: 0,
    ghostFade: 0,
  };
  buildingState.buildingActivityDuration = 6e3;
  buildingState.buildingUndoHistory = Array(buildingState.buildingHistoryCapacity);
  buildingState.buildingUndoCursor = 0;
  buildingState.buildingUndoCount = 0;
  buildingState.buildingRedoHistory = [];
  buildingState.pendingBlockPlacements = [];
  buildingState.blockAnimationInstances = [];
  buildingState.blockSkinAssignments = new Map();
  buildingState.blockSkinsDirty = false;
}
