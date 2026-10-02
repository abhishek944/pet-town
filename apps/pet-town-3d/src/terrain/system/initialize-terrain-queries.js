/** Editable terrain lifecycle, chunks, water masks, raycasting, custom blocks, block icons and lighting updates. */
/** Editable terrain lifecycle, chunks, water masks, raycasting, custom blocks, block icons and lighting updates. */

import { terrainState } from "../state.js";
export function initializeTerrainQueries(state) {
  state.toGridCoordinate = (coordinate) => Math.floor(coordinate + 64);
  state.isGridInBounds = (x, z) => x >= 0 && z >= 0 && x < 128 && z < 128;
  state.gridBlockAt = (x, y, z) =>
    y < 0 || y >= 40 || !state.isGridInBounds(x, z) ? 0 : state.blocks[(z * 128 + x) * 40 + y];
  state.blockAt = (x, y, z) =>
    state.gridBlockAt(state.toGridCoordinate(x), Math.floor(y), state.toGridCoordinate(z));
  state.gridTopAt = (x, z) => (state.isGridInBounds(x, z) ? state.columnTops[z * 128 + x] : 0);
  state.topY = (x, z) => state.gridTopAt(state.toGridCoordinate(x), state.toGridCoordinate(z));
  state.heightAt = (x, z) => {
    let gridX = x + 64 - 0.5;
    let gridZ = z + 64 - 0.5;
    let cellX = Math.floor(gridX);
    let cellZ = Math.floor(gridZ);
    let blendX = gridX - cellX;
    let blendZ = gridZ - cellZ;
    let clampCell = (cell, size) => (cell < 0 ? 0 : cell > size - 1 ? size - 1 : cell);
    let columnHeight = (x, z) => state.columnTops[clampCell(z, 128) * 128 + clampCell(x, 128)];
    let height00 = columnHeight(cellX, cellZ);
    let height10 = columnHeight(cellX + 1, cellZ);
    let height01 = columnHeight(cellX, cellZ + 1);
    let height11 = columnHeight(cellX + 1, cellZ + 1);
    return (
      (height00 * (1 - blendX) + height10 * blendX) * (1 - blendZ) +
      (height01 * (1 - blendX) + height11 * blendX) * blendZ
    );
  };
  state.slopeAt = (x, z) => {
    let slopeX = (state.heightAt(x + 1, z) - state.heightAt(x - 1, z)) * 0.5;
    let slopeZ = (state.heightAt(x, z + 1) - state.heightAt(x, z - 1)) * 0.5;
    return Math.hypot(slopeX, slopeZ);
  };
  state.biomeAt = (x, z) => {
    let cellX = state.toGridCoordinate(x);
    let cellZ = state.toGridCoordinate(z);
    return state.isGridInBounds(cellX, cellZ)
      ? terrainState.terrainBiomeNames[state.island.biome[cellZ * 128 + cellX]]
      : `ocean`;
  };
  state.surfaceAt = (x, z) => {
    let cellX = state.toGridCoordinate(x);
    let cellZ = state.toGridCoordinate(z);
    let topY = state.gridTopAt(cellX, cellZ);
    return topY > 0 ? state.gridBlockAt(cellX, topY - 1, cellZ) : 0;
  };
}
