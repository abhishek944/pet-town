import { allocateChunkBuffers } from "./allocate-chunk-buffers.js";
import { createGrassLipWriter } from "./create-grass-lip-writer.js";
import { createPathRiserWriter } from "./create-path-riser-writer.js";
import { createChunkFaceWriter } from "./create-chunk-face-writer.js";
import { createChunkVertexWriter } from "./create-chunk-vertex-writer.js";
/** Typed buffer growth, beveled chunk construction, grass lip geometry and voxel hashing. */
import { terrainState } from "../state.js";
import { hashTerrainVoxel } from "./hash-terrain-voxel.js";
export function createChunkBuilder(state) {
  return function (startX, startZ, chunkSize) {
    const chunk = {
      startX,
      startZ,
      chunkSize,
    };
    chunk.emitVertex = createChunkVertexWriter(chunk, state);
    chunk.emitFace = createChunkFaceWriter(chunk, state);
    chunk.emitPathRiser = createPathRiserWriter(chunk, state);
    chunk.emitLipVertex = function (
      value74,
      value75,
      value76,
      value77,
      value78,
      value79,
      value80,
      value81,
      value82,
      value83,
      value84,
      value85,
      value86,
      value87,
      value88,
    ) {
      chunk.lipPositions.push(value74, value75, value76);
      chunk.lipNormals.push(
        Math.round(value77 * 127),
        Math.round(value78 * 127),
        Math.round(value79 * 127),
      );
      chunk.lipUvs.push(
        Math.round(Math.max(0, Math.min(1, value80)) * 65535),
        Math.round(Math.max(0, Math.min(1, value81)) * 65535),
      );
      chunk.lipFaceData.push(
        terrainState.terrainTextureLayerIds.FRINGE,
        255,
        Math.round(value88 * 255),
        value82 | (value83 << 3) | (value84 << 4),
      );
      chunk.lipTints.push(
        Math.min(255, Math.round(value85 * 127.5)),
        Math.min(255, Math.round(value86 * 127.5)),
        Math.min(255, Math.round(value87 * 127.5)),
        0,
      );
      return chunk.lipPositions.length / 3 - 1;
    };
    chunk.emitGrassLip = createGrassLipWriter(chunk, state);
    chunk.endX = Math.min(state.sizeX, chunk.startX + chunk.chunkSize);
    chunk.endZ = Math.min(state.sizeZ, chunk.startZ + chunk.chunkSize);
    allocateChunkBuffers(chunk, state);
    chunk.wallMoss = false;
    chunk.lipPositions = [];
    chunk.lipNormals = [];
    chunk.lipUvs = [];
    chunk.lipFaceData = [];
    chunk.lipTints = [];
    chunk.lipIndices = [];
    chunk.lipOverhang = 0.06;
    chunk.lipInset = state.bevel * (1 - Math.SQRT1_2);
    chunk.lipProfile = [
      [-chunk.lipInset, -chunk.lipInset, 1],
      [chunk.lipOverhang, -0.14, 0.86],
      [chunk.lipOverhang, -0.46, 0.54],
    ];
    for (let value41Value = chunk.startZ; value41Value < chunk.endZ; value41Value++) {
      for (let value40Value = chunk.startX; value40Value < chunk.endX; value40Value++) {
        let result178 = state.world.colTop[value41Value * state.sizeX + value40Value];
        for (let index43 = 0; index43 < result178; index43++) {
          let result179 =
            state.blocks[(value41Value * state.sizeX + value40Value) * state.sizeY + index43];
          if (!result179) {
            continue;
          }
          let result180 = !(
            state.isSolid(value40Value + 1, index43, value41Value) &&
            state.isSolid(value40Value - 1, index43, value41Value) &&
            state.isSolid(value40Value, index43 + 1, value41Value) &&
            state.isSolid(value40Value, index43 - 1, value41Value) &&
            state.isSolid(value40Value, index43, value41Value + 1) &&
            state.isSolid(value40Value, index43, value41Value - 1)
          );
          let result181 = !state.isSolid(value40Value, index43 + 1, value41Value);
          if (!result180 && !result181) {
            continue;
          }
          state.cacheNeighbors(value40Value, index43, value41Value);
          let result182 =
            terrainState.terrainBlockDefinitions[result179] ||
            terrainState.terrainBlockDefinitions[1];
          let result183 = !state.cachedSolid(0, 1, 0);
          let hashTerrainVoxelResult = hashTerrainVoxel(value40Value, index43, value41Value);
          let result184 =
            result183 &&
            result179 === terrainState.mesherPathBlockId &&
            state.isDroppedPath(value40Value, index43, value41Value);
          for (let index44 = 0; index44 < 6; index44++) {
            let result185 = terrainState.voxelFaceFrames[index44];
            if (state.cachedSolid(result185.n[0], result185.n[1], result185.n[2])) {
              if (
                index44 !== 2 &&
                index44 !== 3 &&
                result183 &&
                !result184 &&
                state.isDroppedPath(
                  value40Value + result185.n[0],
                  index43,
                  value41Value + result185.n[2],
                )
              ) {
                chunk.emitPathRiser(
                  value40Value,
                  index43,
                  value41Value,
                  index44,
                  result182,
                  hashTerrainVoxelResult,
                );
              }
              continue;
            }
            chunk.emitFace(
              value40Value,
              index43,
              value41Value,
              index44,
              result182,
              hashTerrainVoxelResult,
              result183,
              result184,
            );
            if (
              index44 !== 2 &&
              index44 !== 3 &&
              result183 &&
              result182.exposedSideOver === terrainState.terrainTextureLayerIds.FRINGE &&
              index43 + 1 > state.waterY + 0.3
            ) {
              chunk.emitGrassLip(
                value40Value,
                index43,
                value41Value,
                index44,
                hashTerrainVoxelResult,
              );
            }
          }
        }
      }
    }
    chunk.compactIndices =
      chunk.vertexCount > 65535
        ? chunk.indices.slice(0, chunk.indexCount)
        : Uint16Array.from(chunk.indices.subarray(0, chunk.indexCount));
    return {
      pos: chunk.positions.slice(0, chunk.vertexCount * 3),
      nor: chunk.normals.slice(0, chunk.vertexCount * 3),
      uv: chunk.uvs.slice(0, chunk.vertexCount * 2),
      dat: chunk.faceData.slice(0, chunk.vertexCount * 4),
      tin: chunk.tints.slice(0, chunk.vertexCount * 4),
      gt: chunk.grassData.slice(0, chunk.vertexCount * 4),
      idx: chunk.compactIndices,
      vertCount: chunk.vertexCount,
      faces: chunk.faceCount,
      lip: chunk.lipPositions.length
        ? {
            pos: new Float32Array(chunk.lipPositions),
            nor: new Int8Array(chunk.lipNormals),
            uv: new Uint16Array(chunk.lipUvs),
            dat: new Uint8Array(chunk.lipFaceData),
            tin: new Uint8Array(chunk.lipTints),
            gt: new Uint8Array(chunk.lipFaceData.length),
            idx: (chunk.lipPositions.length / 3 > 65535 ? Uint32Array : Uint16Array).from(
              chunk.lipIndices,
            ),
          }
        : null,
    };
  };
}
