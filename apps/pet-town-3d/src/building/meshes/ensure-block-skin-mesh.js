/** Selection and preview meshes, skinned block instances, debris and block animations. */
import * as THREE from "three";
import { buildingState } from "../state.js";
import { createBlockMaterials } from "../materials/create-block-materials.js";
export function ensureBlockSkinMesh(key, capacity) {
  let result = buildingState.blockSkinMeshes.get(key);
  if (!result || result.instanceMatrix.count < capacity) {
    let result2 = Math.max(64, 2 ** Math.ceil(Math.log2(capacity + 1)));
    let instancedMesh = new THREE.InstancedMesh(
      buildingState.buildingCubeGeometry,
      createBlockMaterials(key, {
        skin: true,
      }),
      result2,
    );
    instancedMesh.castShadow = instancedMesh.receiveShadow = true;
    instancedMesh.frustumCulled = false;
    instancedMesh.userData.key = key;
    instancedMesh.count = 0;
    instancedMesh.name = `skin-` + key;
    if (result) {
      buildingState.buildingEffectsGroup.remove(result);
      result.dispose();
    }
    buildingState.buildingEffectsGroup.add(instancedMesh);
    buildingState.blockSkinMeshes.set(key, instancedMesh);
    result = instancedMesh;
  }
  return result;
}
