/** Typed buffer growth, beveled chunk construction, grass lip geometry and voxel hashing. */
/** Typed buffer growth, beveled chunk construction, grass lip geometry and voxel hashing. */
import { terrainState } from "../state.js";
export function createChunkVertexWriter(chunk, state) {
  return function (u, v) {
    let face = terrainState.voxelFaceFrames[chunk.faceIndex];
    let localX = face.o[0] + face.U[0] * u + face.V[0] * v;
    let localY = face.o[1] + face.U[1] * u + face.V[1] * v;
    let localZ = face.o[2] + face.U[2] * u + face.V[2] * v;
    state.resolveVertexBevel(localX, localY, localZ);
    let worldX = chunk.voxelX - state.halfSize + localX;
    let worldY = chunk.voxelY + localY;
    let worldZ = chunk.voxelZ - state.halfSize + localZ;
    let positionOffset = chunk.vertexCount * 3;
    let bevelHighlight = 0;
    if (state.bevelResult[6] > 0) {
      chunk.positions[positionOffset] = worldX + state.bevelResult[0];
      chunk.positions[positionOffset + 1] = worldY + state.bevelResult[1];
      chunk.positions[positionOffset + 2] = worldZ + state.bevelResult[2];
      chunk.normals[positionOffset] = Math.round(state.bevelResult[3] * 127);
      chunk.normals[positionOffset + 1] = Math.round(state.bevelResult[4] * 127);
      chunk.normals[positionOffset + 2] = Math.round(state.bevelResult[5] * 127);
      let normalAlignment =
        state.bevelResult[3] * face.n[0] +
        state.bevelResult[4] * face.n[1] +
        state.bevelResult[5] * face.n[2];
      bevelHighlight = Math.min(1, (1 - normalAlignment) * 3.4);
    } else {
      chunk.positions[positionOffset] = worldX;
      chunk.positions[positionOffset + 1] = worldY;
      chunk.positions[positionOffset + 2] = worldZ;
      chunk.normals[positionOffset] = face.n[0] * 127;
      chunk.normals[positionOffset + 1] = face.n[1] * 127;
      chunk.normals[positionOffset + 2] = face.n[2] * 127;
    }
    if (
      (chunk.droppedPath && (chunk.positions[positionOffset + 1] -= terrainState.pathSurfaceDrop),
      worldY > 7 + 1e-6 && worldY <= 8.000001)
    ) {
      let shoreDrop = state.shoreDropFactor(worldX, worldZ);
      if (shoreDrop > 0) {
        let shoreHeightScale = 1 - terrainState.shoreEdgeDrop * shoreDrop;
        chunk.positions[positionOffset + 1] =
          7 + (chunk.positions[positionOffset + 1] - 7) * shoreHeightScale;
        let normalY = chunk.normals[positionOffset + 1] / 127;
        if (normalY > 0.2) {
          let derivativeStep = 0.05;
          let shoreSlopeX =
            (state.shoreDropFactor(worldX + derivativeStep, worldZ) -
              state.shoreDropFactor(worldX - derivativeStep, worldZ)) /
            (2 * derivativeStep);
          let shoreSlopeZ =
            (state.shoreDropFactor(worldX, worldZ + derivativeStep) -
              state.shoreDropFactor(worldX, worldZ - derivativeStep)) /
            (2 * derivativeStep);
          let normalX =
            chunk.normals[positionOffset] / 127 +
            terrainState.shoreEdgeDrop * shoreSlopeX * normalY * (worldY - 7);
          let normalZ =
            chunk.normals[positionOffset + 2] / 127 +
            terrainState.shoreEdgeDrop * shoreSlopeZ * normalY * (worldY - 7);
          let normalLength = Math.hypot(normalX, normalY, normalZ);
          chunk.normals[positionOffset] = Math.round((normalX / normalLength) * 127);
          chunk.normals[positionOffset + 1] = Math.round((normalY / normalLength) * 127);
          chunk.normals[positionOffset + 2] = Math.round((normalZ / normalLength) * 127);
        }
      }
    }
    let textureU;
    let textureV;
    let textureParityU;
    let textureParityV;
    if (chunk.faceIndex < 2) {
      textureU = localZ;
      textureV = localY;
      textureParityU = chunk.voxelZ & 1;
      textureParityV = chunk.voxelY & 1;
    } else {
      if (chunk.faceIndex < 4) {
        textureU = localX;
        textureV = localZ;
        textureParityU = chunk.voxelX & 1;
        textureParityV = chunk.voxelZ & 1;
      } else {
        textureU = localX;
        textureV = localY;
        textureParityU = chunk.voxelX & 1;
        textureParityV = chunk.voxelY & 1;
      }
    }
    chunk.uvs[chunk.vertexCount * 2] = Math.round(textureU * 65535);
    chunk.uvs[chunk.vertexCount * 2 + 1] = Math.round(textureV * 65535);
    let ambientOcclusion =
      ((chunk.cornerAo[0] * (1 - u) + chunk.cornerAo[1] * u) * (1 - v) +
        (chunk.cornerAo[2] * (1 - u) + chunk.cornerAo[3] * u) * v) *
      chunk.faceAoScale;
    let dataOffset = chunk.vertexCount * 4;
    chunk.faceData[dataOffset] = chunk.textureLayer;
    chunk.faceData[dataOffset + 1] = chunk.overlayLayer;
    chunk.faceData[dataOffset + 2] = Math.round(Math.min(1, ambientOcclusion) * 255);
    chunk.faceData[dataOffset + 3] =
      chunk.faceIndex | (textureParityU << 3) | (textureParityV << 4);
    let wallHeightFraction = 1;
    let wallHeight = 0;
    if (chunk.faceIndex !== 2 && chunk.faceIndex !== 3) {
      state.world.wallAt(worldX, worldZ, state.wallRange);
      wallHeight = state.wallRange[1] - state.wallRange[0];
      wallHeightFraction =
        wallHeight > 0
          ? Math.min(
              1,
              Math.max(
                0,
                (worldY + (chunk.droppedPath ? -0.085 : 0) - state.wallRange[0]) / wallHeight,
              ),
            )
          : 1;
    }
    state.tint(
      chunk.blockDefinition.tint,
      worldX,
      chunk.positions[positionOffset + 1],
      worldZ,
      chunk.faceIndex,
      chunk.voxelVariation,
      chunk.tint,
      wallHeightFraction,
      wallHeight,
    );
    chunk.tints[dataOffset] = Math.min(255, Math.round(chunk.tint[0] * 127.5));
    chunk.tints[dataOffset + 1] = Math.min(255, Math.round(chunk.tint[1] * 127.5));
    chunk.tints[dataOffset + 2] = Math.min(255, Math.round(chunk.tint[2] * 127.5));
    chunk.tints[dataOffset + 3] = Math.round(bevelHighlight * 255);
    if (chunk.grassEdgeMask) {
      state.tint(
        `grass`,
        worldX,
        worldY,
        worldZ,
        chunk.faceIndex,
        chunk.voxelVariation,
        chunk.grassTint,
        1,
        0,
      );
      chunk.grassData[dataOffset] = Math.min(255, Math.round(chunk.grassTint[0] * 127.5));
      chunk.grassData[dataOffset + 1] = Math.min(255, Math.round(chunk.grassTint[1] * 127.5));
      chunk.grassData[dataOffset + 2] = Math.min(255, Math.round(chunk.grassTint[2] * 127.5));
    } else {
      if (chunk.wallMoss && wallHeight > 0) {
        chunk.grassData[dataOffset] = Math.round(
          Math.min(
            1,
            Math.max(0, state.moss(worldX, worldY, worldZ, state.wallRange[0], state.wallRange[1])),
          ) * 255,
        );
        chunk.grassData[dataOffset + 1] = chunk.grassData[dataOffset + 2] = 0;
      } else {
        chunk.grassData[dataOffset] =
          chunk.grassData[dataOffset + 1] =
          chunk.grassData[dataOffset + 2] =
            0;
      }
    }
    chunk.grassData[dataOffset + 3] = chunk.grassEdgeMask;
    return chunk.vertexCount++;
  };
}
