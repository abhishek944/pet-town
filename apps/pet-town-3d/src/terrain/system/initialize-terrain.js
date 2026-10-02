import { initializeTerrainColumns } from "./initialize-terrain-columns.js";
import { initializeTerrainMeshes } from "./initialize-terrain-meshes.js";
import { initializeTerrainWaterMask } from "./initialize-terrain-water-mask.js";
import { initializeTerrainQueries } from "./initialize-terrain-queries.js";
import { exposeTerrainApi } from "./expose-terrain-api.js";
import { createCustomBlockRegistry } from "./create-custom-block-registry.js";
import { createTerrainRaycaster } from "./create-terrain-raycaster.js";
import { createBlockSetter } from "./create-block-setter.js";
import { createTerrainChunkRebuilder } from "./create-terrain-chunk-rebuilder.js";

/** Editable terrain lifecycle, chunks, water masks, raycasting, custom blocks, block icons and lighting updates. */

import { flushTerrainTextureLayers } from "../textures/atlas/flush-terrain-texture-layers.js";
export function initializeTerrain(context) {
  const state = {
    context,
  };
  state.rebuildChunk = createTerrainChunkRebuilder(state);
  state.markChunksDirty = function (value56, value57) {
    let result67 = Math.floor(value56 / 16);
    let result68 = Math.floor(value57 / 16);
    let result69 = value56 - result67 * 16;
    let result70 = value57 - result68 * 16;
    for (let result71 = -1; result71 <= 1; result71++) {
      for (let result72 = -1; result72 <= 1; result72++) {
        if (
          (result72 === -1 && result69 > 2) ||
          (result72 === 1 && result69 < 13) ||
          (result71 === -1 && result70 > 2) ||
          (result71 === 1 && result70 < 13)
        ) {
          continue;
        }
        let result73 = result67 + result72;
        let result74 = result68 + result71;
        if (result73 >= 0 && result74 >= 0 && result73 < 8 && result74 < 8) {
          state.dirtyChunks.add(result74 * 8 + result73);
        }
      }
    }
  };
  state.setBlock = createBlockSetter(state);
  state.flush = function () {
    state.flushAtlas?.();
    for (let result80 of state.dirtyChunks) {
      state.rebuildChunk(result80 % 8, Math.floor(result80 / 8));
    }
    state.dirtyChunks.clear();
  };
  state.raycast = createTerrainRaycaster(state);
  state.registerBlock = createCustomBlockRegistry(state);
  initializeTerrainColumns(state);
  initializeTerrainMeshes(state);
  initializeTerrainWaterMask(state);
  initializeTerrainQueries(state);
  state.dirtyChunks = new Set();
  state.changeListeners = [];
  state.customBlockIds = new Map();
  state.atlasDirty = false;
  state.flushAtlas = () => {
    if (state.atlasDirty) {
      state.atlasDirty = false;
      flushTerrainTextureLayers(state.atlas);
      state.material.userData.syncAtlas();
      state.blockIconCache.clear();
    }
  };
  state.blockIconCache = new Map();
  exposeTerrainApi(state);
}
