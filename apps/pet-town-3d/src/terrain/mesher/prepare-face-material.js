/** Typed buffer growth, beveled chunk construction, grass lip geometry and voxel hashing. */
/** Typed buffer growth, beveled chunk construction, grass lip geometry and voxel hashing. */
import { terrainState } from "../state.js";
export function prepareFaceMaterial(face, chunk, state) {
  face.frame = terrainState.voxelFaceFrames[face.direction];
  if (
    ((chunk.voxelX = face.x),
    (chunk.voxelY = face.y),
    (chunk.voxelZ = face.z),
    (chunk.faceIndex = face.direction),
    (chunk.blockDefinition = face.block),
    (chunk.voxelVariation = face.variation),
    (chunk.droppedPath = face.droppedPath && face.direction === 2),
    (chunk.faceAoScale = face.direction === 3 ? 0.55 : 1),
    (chunk.overlayLayer = 255),
    (chunk.wallMoss =
      face.direction !== 2 &&
      face.direction !== 3 &&
      !!state.moss &&
      terrainState.mesherMossEligibleBlockIds.has(
        state.blocks[(face.z * state.sizeX + face.x) * state.sizeY + face.y],
      ) &&
      face.y + 1 > state.waterY),
    face.direction === 2
      ? ((chunk.textureLayer = face.block.top),
        face.block.topOver != null && (chunk.overlayLayer = face.block.topOver))
      : face.direction === 3
        ? (chunk.textureLayer = face.block.bottom)
        : ((chunk.textureLayer = face.block.side),
          face.exposedTop &&
            face.block.exposedSideOver != null &&
            (chunk.overlayLayer = face.block.exposedSideOver)),
    (chunk.grassEdgeMask = 0),
    face.direction === 2 && face.block.blendGrass)
  ) {
    let callback14 = (value54, value55) => {
      let result114 = face.x + value54;
      let result115 = face.z + value55;
      if (result114 < 0 || result115 < 0 || result114 >= state.sizeX || result115 >= state.sizeZ) {
        return 0;
      }
      let result116 = (result115 * state.sizeX + result114) * state.sizeY + face.y;
      return +(
        state.blocks[result116] === terrainState.mesherGrassBlockId &&
        (face.y + 1 >= state.sizeY || !state.blocks[result116 + 1])
      );
    };
    chunk.grassEdgeMask =
      callback14(-1, 0) |
      (callback14(1, 0) << 1) |
      (callback14(0, -1) << 2) |
      (callback14(0, 1) << 3) |
      (callback14(-1, -1) << 4) |
      (callback14(1, -1) << 5) |
      (callback14(-1, 1) << 6) |
      (callback14(1, 1) << 7);
  }
  chunk.cornerAo[0] = state.sampleAmbientOcclusion(face.x, face.y, face.z, face.frame, 0, 0);
  chunk.cornerAo[1] = state.sampleAmbientOcclusion(face.x, face.y, face.z, face.frame, 1, 0);
  chunk.cornerAo[2] = state.sampleAmbientOcclusion(face.x, face.y, face.z, face.frame, 0, 1);
  chunk.cornerAo[3] = state.sampleAmbientOcclusion(face.x, face.y, face.z, face.frame, 1, 1);
}
