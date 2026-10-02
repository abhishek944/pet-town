/** Typed buffer growth, beveled chunk construction, grass lip geometry and voxel hashing. */
/** Typed buffer growth, beveled chunk construction, grass lip geometry and voxel hashing. */
import { terrainState } from "../state.js";
export function createPathRiserWriter(chunk, state) {
  return function (value67, value68, value69, value70, sideValue, value71) {
    let result145 = terrainState.voxelFaceFrames[value70];
    chunk.voxelX = value67;
    chunk.voxelY = value68;
    chunk.voxelZ = value69;
    chunk.faceIndex = value70;
    chunk.blockDefinition = sideValue;
    chunk.voxelVariation = value71;
    chunk.droppedPath = false;
    chunk.faceAoScale = 1;
    chunk.grassEdgeMask = 0;
    chunk.wallMoss = false;
    chunk.textureLayer = sideValue.side;
    chunk.overlayLayer = sideValue.exposedSideOver == null ? 255 : sideValue.exposedSideOver;
    chunk.cornerAo[0] = chunk.cornerAo[2] = 0.8;
    chunk.cornerAo[1] = chunk.cornerAo[3] = 0.97;
    if (result145.va === 1) {
      chunk.cornerAo[0] = chunk.cornerAo[1] = 0.8;
      chunk.cornerAo[2] = chunk.cornerAo[3] = 0.97;
    }
    chunk.ensureCapacity(4, 6);
    let result146 = 0.915;
    let callback16 = (value72, value73) => chunk.emitVertex(value72, value73);
    let result147;
    let result148;
    let result149;
    let result150;
    if (result145.ua === 1) {
      result147 = callback16(result146, 0);
      result148 = callback16(1, 0);
      result149 = callback16(1, 1);
      result150 = callback16(result146, 1);
    } else {
      result147 = callback16(0, result146);
      result148 = callback16(1, result146);
      result149 = callback16(1, 1);
      result150 = callback16(0, 1);
    }
    let result151 = 1 / Math.hypot(0.75, 1);
    for (let result152 of [result147, result148, result149, result150]) {
      chunk.normals[result152 * 3] = Math.round(result145.n[0] * 0.75 * result151 * 127);
      chunk.normals[result152 * 3 + 1] = Math.round(result151 * 127);
      chunk.normals[result152 * 3 + 2] = Math.round(result145.n[2] * 0.75 * result151 * 127);
    }
    chunk.indices[chunk.indexCount++] = result147;
    chunk.indices[chunk.indexCount++] = result148;
    chunk.indices[chunk.indexCount++] = result149;
    chunk.indices[chunk.indexCount++] = result147;
    chunk.indices[chunk.indexCount++] = result149;
    chunk.indices[chunk.indexCount++] = result150;
  };
}
