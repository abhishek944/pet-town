/** Editable terrain lifecycle, chunks, water masks, raycasting, custom blocks, block icons and lighting updates. */
/** Editable terrain lifecycle, chunks, water masks, raycasting, custom blocks, block icons and lighting updates. */
import * as THREE from "three";
import { terrainState } from "../state.js";
import { createTerrainBlockIcon } from "../textures/icons/create-terrain-block-icon.js";
export function exposeTerrainApi(state) {
  state.context.terrain = {
    size: state.size,
    expansion: state.island.expansion,
    ocean: state.island.ocean,
    bounds: {
      minX: -state.half,
      minZ: -state.half,
      maxX: state.half,
      maxZ: state.half,
    },
    height: 40,
    chunkSize: 16,
    waterLevel: terrainState.terrainWaterLevel,
    WATER_LEVEL: terrainState.terrainWaterLevel,
    group: state.group,
    material: state.material,
    atlas: state.atlas,
    stats: state.stats,
    BLOCK: terrainState.terrainBlockIds,
    blocks: terrainState.terrainBlockDefinitions,
    heightAt: state.heightAt,
    topY: state.topY,
    surfaceAt: state.surfaceAt,
    blockAt: state.blockAt,
    isSolid: (value65, value66, value67) => state.blockAt(value65, value66, value67) !== 0,
    setBlock: state.setBlock,
    flush: state.flush,
    raycast: state.raycast,
    biomeAt: state.biomeAt,
    slopeAt: state.slopeAt,
    registerBlock: state.registerBlock,
    isWater: (value68, value69) => {
      let callback7Result7 = state.toGridCoordinate(value68);
      let callback7Result8 = state.toGridCoordinate(value69);
      return (
        !state.isGridInBounds(callback7Result7, callback7Result8) ||
        state.waterMaskPixels[callback7Result8 * state.size + callback7Result7] > 0
      );
    },
    isBelowWaterLevel: (value70, value71) =>
      state.topY(value70, value71) < terrainState.terrainWaterLevel,
    waterMaskTexture: state.waterMaskTexture,
    onChange: (value72) => state.changeListeners.push(value72),
    blockIcon: (value73, value74 = 64) => {
      let result104 = value73 + `:` + value74;
      if (!state.blockIconCache.has(result104)) {
        state.blockIconCache.set(
          result104,
          createTerrainBlockIcon(
            state.atlas,
            terrainState.terrainBlockDefinitions[value73] ||
              terrainState.terrainBlockDefinitions[1],
            value74,
          ),
        );
      }
      return state.blockIconCache.get(result104);
    },
    heightTexture: state.heightTexture,
    spawn: {
      x: 2.5,
      y: state.topY(2.5, 3.5),
      z: 3.5,
    },
    landmarks: {
      pond: {
        ...terrainState.terrainPondLandmark,
      },
      hill: {
        ...terrainState.terrainHillLandmark,
      },
    },
    buildMs: 0,
    version: 0,
  };
  state.context.terrain.buildMs = Math.round(performance.now() - state.startedAt);
  console.info(
    `[terrain] built in ${state.context.terrain.buildMs}ms (atlas ${Math.round(state.atlas.ms)}ms), ${state.stats.verts} verts, ${state.stats.tris} tris, ${state.group.children.length} chunks`,
  );
  state.debugCameraParameter = state.context.params.get(`terrainDebugCam`);
  if (state.debugCameraParameter) {
    let [result105, result106, result107, result108, result109, result110] =
      state.debugCameraParameter.split(`,`).map(Number);
    let result111 = (state.context._terrainDebugCam = {
      p: new THREE.Vector3(result105, result106, result107),
      t: new THREE.Vector3(result108, result109, result110),
    });
    let onBeforeRender2 = state.context.scene.onBeforeRender;
    state.context.scene.onBeforeRender = function (...value75) {
      onBeforeRender2?.apply(this, value75);
      let result112 = value75[2] ?? state.context.camera;
      if (result112 === state.context.camera) {
        result112.position.copy(result111.p);
        result112.lookAt(result111.t);
        result112.updateMatrixWorld();
      }
    };
  }
}
