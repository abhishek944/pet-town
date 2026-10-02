/** Typed buffer growth, beveled chunk construction, grass lip geometry and voxel hashing. */
/** Typed buffer growth, beveled chunk construction, grass lip geometry and voxel hashing. */

import { growTypedArrayCapacity } from "./grow-typed-array-capacity.js";
export function allocateChunkBuffers(chunk, state) {
  chunk.capacity = 4096;
  chunk.positions = new Float32Array(chunk.capacity * 3);
  chunk.normals = new Int8Array(chunk.capacity * 3);
  chunk.uvs = new Uint16Array(chunk.capacity * 2);
  chunk.faceData = new Uint8Array(chunk.capacity * 4);
  chunk.tints = new Uint8Array(chunk.capacity * 4);
  chunk.grassData = new Uint8Array(chunk.capacity * 4);
  chunk.indices = new Uint32Array(chunk.capacity * 3);
  chunk.vertexCount = 0;
  chunk.indexCount = 0;
  chunk.faceCount = 0;
  chunk.tint = [1, 1, 1];
  chunk.grassTint = [1, 1, 1];
  chunk.cornerAo = new Float32Array(4);
  chunk.gridVertices = new Int32Array(81);
  chunk.gridAo = new Float32Array(81);
  chunk.subdivisionU = new Float32Array(9);
  chunk.subdivisionV = new Float32Array(9);
  chunk.subdivisionKindsU = new Int8Array(9);
  chunk.subdivisionKindsV = new Int8Array(9);
  chunk.ensureCapacity = (value43, value44) => {
    if (chunk.vertexCount + value43 > chunk.capacity) {
      chunk.capacity = Math.max(chunk.vertexCount + value43, Math.ceil(chunk.capacity * 1.6));
      chunk.positions = growTypedArrayCapacity(chunk.positions, chunk.capacity * 3);
      chunk.normals = growTypedArrayCapacity(chunk.normals, chunk.capacity * 3);
      chunk.uvs = growTypedArrayCapacity(chunk.uvs, chunk.capacity * 2);
      chunk.faceData = growTypedArrayCapacity(chunk.faceData, chunk.capacity * 4);
      chunk.tints = growTypedArrayCapacity(chunk.tints, chunk.capacity * 4);
      chunk.grassData = growTypedArrayCapacity(chunk.grassData, chunk.capacity * 4);
    }
    if (chunk.indexCount + value44 > chunk.indices.length) {
      chunk.indices = growTypedArrayCapacity(chunk.indices, chunk.indexCount + value44);
    }
  };
}
