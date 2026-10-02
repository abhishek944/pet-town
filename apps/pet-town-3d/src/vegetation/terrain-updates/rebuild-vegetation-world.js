/** Vegetation rebuilds, terrain subscriptions, dirty-cell resampling and item removal. */
import { disposeVegetationFields } from "./dispose-vegetation-fields.js";
import { vegetationState } from "../state.js";
import { createVegetationTerrainAdapter } from "../terrain-adapter/create-vegetation-terrain-adapter.js";
import { createVegetationFields } from "../assets/create-vegetation-fields.js";
import { populateVegetationWorld } from "../placement/populate-vegetation-world.js";
import { rebuildVegetationProxyMeshes } from "../proxies/rebuild-vegetation-proxy-meshes.js";
import { DynamicVegetationField } from "../visibility/dynamic-vegetation-field.js";
import { hideVegetationForWaterPass } from "../instances/hide-vegetation-for-water-pass.js";
import { restoreVegetationAfterWaterPass } from "../instances/restore-vegetation-after-water-pass.js";
import { getVegetationTerrainRevision } from "./get-vegetation-terrain-revision.js";
export function rebuildVegetationWorld(terrainValue) {
  let result = performance.now();
  if (
    (disposeVegetationFields(),
    (vegetationState.vegetationRuntimeState.ground =
      createVegetationTerrainAdapter(terrainValue).snapshot()),
    vegetationState.vegetationRuntimeState.ground.validCount < 16)
  ) {
    vegetationState.vegetationRuntimeState.built = false;
    return false;
  }
  vegetationState.vegetationRuntimeState.fields = createVegetationFields();
  populateVegetationWorld();
  vegetationState.vegetationRuntimeState.chunkMeshes = [];
  vegetationState.vegetationRuntimeState.lodChunks = [];
  for (let result2 of Object.values(vegetationState.vegetationRuntimeState.fields)) {
    result2.build(vegetationState.vegetationRuntimeState.group);
  }
  rebuildVegetationProxyMeshes();
  vegetationState.vegetationRuntimeState.dyn = new DynamicVegetationField(
    `grass`,
    vegetationState.vegetationRuntimeState.lib.grass[1][0],
    vegetationState.vegetationRuntimeState.materials.grass.mat,
    4096,
  );
  Object.assign(vegetationState.vegetationRuntimeState.dyn.mesh.userData, {
    refract: false,
    reflect: `never`,
  });
  vegetationState.vegetationRuntimeState.dyn.mesh.onBeforeRender = hideVegetationForWaterPass;
  vegetationState.vegetationRuntimeState.dyn.mesh.onAfterRender = restoreVegetationAfterWaterPass;
  vegetationState.vegetationRuntimeState.group.add(vegetationState.vegetationRuntimeState.dyn.mesh);
  vegetationState.vegetationRuntimeState.fields.dyn = vegetationState.vegetationRuntimeState.dyn;
  vegetationState.vegetationRuntimeState.built = true;
  vegetationState.vegetationRuntimeState.layerApplied = false;
  vegetationState.vegetationRuntimeState.terrainRef = terrainValue.terrain;
  vegetationState.vegetationRuntimeState.terrainVersion = getVegetationTerrainRevision(
    terrainValue.terrain,
  );
  vegetationState.vegetationRuntimeState.stats.buildMs = Math.round(performance.now() - result);
  vegetationState.vegetationRuntimeState.stats.drawMeshes =
    vegetationState.vegetationRuntimeState.group.children.length;
  if (!vegetationState.vegetationRuntimeState.loggedOnce) {
    console.info(`[vegetation]`, JSON.stringify(vegetationState.vegetationRuntimeState.stats));
    vegetationState.vegetationRuntimeState.loggedOnce = true;
  }
  return true;
}
