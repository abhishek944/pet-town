/** Editable terrain lifecycle, chunks, water masks, raycasting, custom blocks, block icons and lighting updates. */

export function createBlockSetter(state) {
  return function (x, y, z, blockId) {
    let gridX = state.toGridCoordinate(x);
    let gridY = Math.floor(y);
    let gridZ = state.toGridCoordinate(z);
    if (!state.isGridInBounds(gridX, gridZ) || gridY < 0 || gridY >= 40) {
      return false;
    }
    let voxelIndex = (gridZ * 128 + gridX) * 40 + gridY;
    let previousBlockId = state.blocks[voxelIndex];
    if (previousBlockId === blockId) {
      return false;
    }
    state.blocks[voxelIndex] = blockId;
    state.updateColumnTop(gridX, gridZ);
    state.wallHeightsDirty = true;
    state.heightPixels[gridZ * 128 + gridX] = state.columnTops[gridZ * 128 + gridX];
    state.heightTexture.needsUpdate = true;
    state.updateWaterMask(gridX, gridZ);
    state.markChunksDirty(gridX, gridZ);
    let change = {
      x: gridX - 64,
      y: gridY,
      z: gridZ - 64,
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
