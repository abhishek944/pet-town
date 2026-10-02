import { createChunkBuilder } from "./create-chunk-builder.js";
import { createAmbientOcclusionSampler } from "./create-ambient-occlusion-sampler.js";
import { createVertexBevelResolver } from "./create-vertex-bevel-resolver.js";
import { createShoreFaceQuery } from "./create-shore-face-query.js";
import { createShoreDropSampler } from "./create-shore-drop-sampler.js";
/** Typed buffer growth, beveled chunk construction, grass lip geometry and voxel hashing. */
import { terrainState } from "../state.js";
export function createBeveledTerrainMesher(world, options) {
  const state = {
    world,
    options,
  };
  state.shoreDropFactor = createShoreDropSampler(state);
  state.faceTouchesShore = createShoreFaceQuery(state);
  state.cacheCorner = function (value25, value26, value27) {
    for (let index5 = 0; index5 < 8; index5++) {
      state.cornerOccupancy[index5] = state.cachedSolid(
        value25 - 1 + (index5 & 1),
        value26 - 1 + ((index5 >> 1) & 1),
        value27 - 1 + ((index5 >> 2) & 1),
      );
    }
  };
  state.cornerNeedsBevel = function () {
    for (let index6 = 0; index6 < 8; index6++) {
      if (
        state.cornerOccupancy[index6] &&
        +!state.cornerOccupancy[index6 ^ 1] +
          +!state.cornerOccupancy[index6 ^ 2] +
          +!state.cornerOccupancy[index6 ^ 4] >=
          2
      ) {
        return true;
      }
    }
    return false;
  };
  state.cornerHasAxisBoundary = function (value28) {
    let result37 = 1 << value28;
    for (let index7 = 0; index7 < 8; index7++) {
      if (
        !(index7 & result37) &&
        state.cornerOccupancy[index7] !== state.cornerOccupancy[index7 | result37]
      ) {
        return true;
      }
    }
    return false;
  };
  state.cornerBevelAxes = function (value29, value30, value31) {
    return state.currentVoxelY + value30 <= state.flatBelow ||
      (state.cacheCorner(value29, value30, value31), !state.cornerNeedsBevel())
      ? 0
      : +!!state.cornerHasAxisBoundary(0) |
          (state.cornerHasAxisBoundary(1) ? 2 : 0) |
          (state.cornerHasAxisBoundary(2) ? 4 : 0);
  };
  state.resolveVertexBevel = createVertexBevelResolver(state);
  state.sampleAmbientOcclusion = createAmbientOcclusionSampler(state);
  state.buildChunk = createChunkBuilder(state);
  ({
    SX: state.sizeX,
    SY: state.sizeY,
    SZ: state.sizeZ,
    blocks: state.blocks,
    HALF: state.halfSize,
  } = state.world);
  state.bevel = state.options.bevel ?? 0.22;
  state.bevelInset = state.bevel * 0.586;
  state.tint = state.options.tint;
  state.moss = state.options.moss;
  state.waterY = state.options.waterY ?? 7.6;
  state.wallRange = [0, 0];
  state.flatBelow = state.options.flatBelow ?? -1;
  state.isSolid = (value, value2, value3) =>
    value2 < 0
      ? 1
      : value2 >= state.sizeY ||
          value < 0 ||
          value3 < 0 ||
          value >= state.sizeX ||
          value3 >= state.sizeZ ||
          state.blocks[(value3 * state.sizeX + value) * state.sizeY + value2] === 0
        ? 0
        : 1;
  state.blockAt = (value4, value5, value6) =>
    value5 < 0 ||
    value5 >= state.sizeY ||
    value4 < 0 ||
    value6 < 0 ||
    value4 >= state.sizeX ||
    value6 >= state.sizeZ
      ? 0
      : state.blocks[(value6 * state.sizeX + value4) * state.sizeY + value5];
  state.columnTop = (value7, value8) =>
    value7 < 0 || value8 < 0 || value7 >= state.sizeX || value8 >= state.sizeZ
      ? 0
      : state.world.colTop[value8 * state.sizeX + value7];
  state.isLowShore = (value9, value10) => {
    for (let result14 = -1; result14 <= 1; result14++) {
      for (let result15 = -1; result15 <= 1; result15++) {
        if (
          state.columnTop(value9 + result15, value10 + result14) >
          terrainState.shoreSurfaceBlockHeight
        ) {
          return false;
        }
      }
    }
    return true;
  };
  state.isDroppedPath = (value16, value17, value18) => {
    if (state.blockAt(value16, value17, value18) !== terrainState.mesherPathBlockId) {
      return false;
    }
    for (let result32 = -1; result32 <= 1; result32++) {
      for (let result33 = -1; result33 <= 1; result33++) {
        if (
          ((result33 || result32) &&
            !state.isSolid(value16 + result33, value17, value18 + result32)) ||
          state.isSolid(value16 + result33, value17 + 1, value18 + result32)
        ) {
          return false;
        }
      }
    }
    return true;
  };
  state.neighborOccupancy = new Uint8Array(27);
  state.currentVoxelY = 0;
  state.cacheNeighbors = (value19, value20, value21) => {
    state.currentVoxelY = value20;
    let index4 = 0;
    for (let result34 = -1; result34 <= 1; result34++) {
      for (let result35 = -1; result35 <= 1; result35++) {
        for (let result36 = -1; result36 <= 1; result36++) {
          state.neighborOccupancy[index4++] = state.isSolid(
            value19 + result36,
            value20 + result35,
            value21 + result34,
          );
        }
      }
    }
  };
  state.cachedSolid = (value22, value23, value24) =>
    state.neighborOccupancy[value22 + 1 + (value23 + 1) * 3 + (value24 + 1) * 9];
  state.cornerOccupancy = new Uint8Array(8);
  state.bevelResult = new Float32Array(7);
  state.boundaryAxes = new Int8Array(3);
  state.boundaryOffsets = new Int8Array(3);
  state.bevelOccupancy = new Uint8Array(8);
  state.bevelVisited = new Uint8Array(8);
  state.bevelQueue = new Uint8Array(8);
  state.localPosition = [0, 0, 0];
  state.neighborOffset = [0, 0, 0];
  state.interiorEdgeDirections = [0, 0, 0];
  state.interiorEdgeDistances = [0, 0, 0];
  state.candidateNormal = [0, 0, 0];
  return {
    build: state.buildChunk,
    sol: state.isSolid,
    isDropped: state.isDroppedPath,
  };
}
