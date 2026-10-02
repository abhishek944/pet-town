/** Guarded initialization and per-frame vegetation updates including props, water bobbing, quality and wind. */
import * as THREE from "three";
import { vegetationState } from "../state.js";
import { createVegetationSharedUniforms } from "../materials/create-vegetation-shared-uniforms.js";
import { createVegetationAssetLibrary } from "../assets/create-vegetation-asset-library.js";
import { createVegetationApi } from "../api/create-vegetation-api.js";
import { isVegetationTerrainReady } from "../terrain-updates/is-vegetation-terrain-ready.js";
import { subscribeVegetationTerrainChanges } from "../terrain-updates/subscribe-vegetation-terrain-changes.js";
import { rebuildVegetationWorld } from "../terrain-updates/rebuild-vegetation-world.js";
export function initializeVegetationRuntime(context) {
  let result = context.params?.get?.(`seed`);
  vegetationState.vegetationRuntimeState = {
    ctx: context,
    seed:
      (result &&
        (parseInt(result, 10) ||
          [...result].reduce(
            (value, charCodeAtValue) => (value * 31 + charCodeAtValue.charCodeAt(0)) | 0,
            7,
          ))) ||
      20260929,
    group: new THREE.Group(),
    shared: createVegetationSharedUniforms(),
    built: false,
    trees: [],
    colliders: [],
    floaters: [],
    registry: new Map(),
    dirty: new Set(),
    chunkMeshes: [],
    lodChunks: [],
    rebuildAt: -1,
    stats: {},
    windTime: 0,
    tries: 0,
    clearLog: new Map(),
  };
  vegetationState.vegetationRuntimeState.group.name = `vegetation`;
  context.scene.add(vegetationState.vegetationRuntimeState.group);
  createVegetationAssetLibrary();
  context.vegetation = createVegetationApi(context);
  if (isVegetationTerrainReady(context)) {
    subscribeVegetationTerrainChanges(context);
    rebuildVegetationWorld(context);
  }
}
