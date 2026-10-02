import { prepareFaceMaterial } from "./prepare-face-material.js";
import { prepareFaceSubdivisions } from "./prepare-face-subdivisions.js";
import { prepareFaceShoreEdges } from "./prepare-face-shore-edges.js";
import { writeFaceGrid } from "./write-face-grid.js";
/** Typed buffer growth, beveled chunk construction, grass lip geometry and voxel hashing. */
/** Typed buffer growth, beveled chunk construction, grass lip geometry and voxel hashing. */

export function createChunkFaceWriter(chunk, state) {
  return function (x, y, z, direction, block, variation, exposedTop, droppedPath) {
    const face = {
      x,
      y,
      z,
      direction,
      block,
      variation,
      exposedTop,
      droppedPath,
    };
    prepareFaceMaterial(face, chunk, state);
    prepareFaceSubdivisions(face, chunk, state);
    prepareFaceShoreEdges(face, chunk, state);
    writeFaceGrid(face, chunk, state);
  };
}
