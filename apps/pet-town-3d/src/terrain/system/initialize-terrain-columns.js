import { createWallHeightRebuilder } from "./create-wall-height-rebuilder.js";
/** Editable terrain lifecycle, chunks, water masks, raycasting, custom blocks, block icons and lighting updates. */
/** Editable terrain lifecycle, chunks, water masks, raycasting, custom blocks, block icons and lighting updates. */

import { generateIslandTerrain } from "../island-generation/generate-island-terrain.js";
export function initializeTerrainColumns(state) {
  state.startedAt = performance.now();
  state.island = generateIslandTerrain(7);
  state.blocks = state.island.blocks;
  state.columnTops = new Int16Array(16384);
  state.updateColumnTop = (value, value2) => {
    let index = 0;
    let result9 = (value2 * 128 + value) * 40;
    for (let result10 = 39; result10 >= 0; result10--) {
      if (state.blocks[result9 + result10]) {
        index = result10 + 1;
        break;
      }
    }
    state.columnTops[value2 * 128 + value] = index;
  };
  for (let index2 = 0; index2 < 128; index2++) {
    for (let index3 = 0; index3 < 128; index3++) {
      state.updateColumnTop(index3, index2);
    }
  }
  state.world = {
    SX: 128,
    SY: 40,
    SZ: 128,
    HALF: 64,
    blocks: state.blocks,
    colTop: state.columnTops,
  };
  state.wallMaximums = new Float32Array(16384);
  state.wallMinimums = new Float32Array(16384);
  state.wallHeightsDirty = true;
  state.rebuildWallHeights = createWallHeightRebuilder(state);
  state.world.wallAt = (value5, value6, value7) => {
    if (state.wallHeightsDirty) {
      state.rebuildWallHeights();
    }
    let result19 = value5 + 64 - 0.5;
    let result20 = value6 + 64 - 0.5;
    let result21 = Math.floor(result19);
    let result22 = Math.floor(result20);
    let result23 = result19 - result21;
    let result24 = result20 - result22;
    let callback19 = (value8) => (value8 < 0 ? 0 : value8 >= 128 ? 127 : value8);
    let callback20 = (value9) => (value9 < 0 ? 0 : value9 >= 128 ? 127 : value9);
    let result25 = callback20(result22) * 128 + callback19(result21);
    let result26 = callback20(result22) * 128 + callback19(result21 + 1);
    let result27 = callback20(result22 + 1) * 128 + callback19(result21);
    let result28 = callback20(result22 + 1) * 128 + callback19(result21 + 1);
    let callback21 = (value10) =>
      (value10[result25] * (1 - result23) + value10[result26] * result23) * (1 - result24) +
      (value10[result27] * (1 - result23) + value10[result28] * result23) * result24;
    value7[0] = callback21(state.wallMinimums);
    value7[1] = callback21(state.wallMaximums);
    return value7;
  };
}
