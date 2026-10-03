/** Editable terrain lifecycle, chunks, water masks, raycasting, custom blocks, block icons and lighting updates. */

export function createBlockSetter(state) {
  return function (x, y, z, blockId) {
    let gridX = state.toGridCoordinate(x);
    let gridY = Math.floor(y);
    let gridZ = state.toGridCoordinate(z);
    if (!state.isGridInBounds(gridX, gridZ) || gridY < 0 || gridY >= 40) {
      return false;
    }
    let voxelIndex = (gridZ * state.size + gridX) * 40 + gridY;
    let previousBlockId = state.blocks[voxelIndex];
    if (previousBlockId === blockId) {
      return false;
    }
    const previousTop = state.columnTops[gridZ * state.size + gridX];
    state.blocks[voxelIndex] = blockId;
    state.updateColumnTop(gridX, gridZ);
    if (previousTop !== state.columnTops[gridZ * state.size + gridX]) {
      state.rebuildWallHeights(gridX, gridZ);
    }
    state.heightPixels[gridZ * state.size + gridX] = state.columnTops[gridZ * state.size + gridX];
    state.heightTexture.needsUpdate = true;
    state.updateWaterMask(gridX, gridZ);
    state.markChunksDirty(gridX, gridZ);
    let change = {
      x: gridX - state.half,
      y: gridY,
      z: gridZ - state.half,
      id: blockId,
      prev: previousBlockId,
    };
    state.context.terrain.version++;
    for (let listener of state.changeListeners) {
      try {
        listener(change);
      } catch (error) {
        console.warn(`[terrain] onChange listener failed`, error);
      }
    }
    try {
      dispatchEvent(
        new CustomEvent(`terrain:change`, {
          detail: change,
        }),
      );
    } catch {}
    return true;
  };
}
