/** Selection and preview meshes, skinned block instances, debris and block animations. */
import { buildingState } from "../state.js";
import { ensureBlockSkinMesh } from "./ensure-block-skin-mesh.js";
export function rebuildBlockSkinMeshes() {
  buildingState.blockSkinsDirty = false;
  let lookup = new Map();
  for (let [result, result2] of buildingState.blockSkinAssignments) {
    if (!lookup.has(result2.key)) {
      lookup.set(result2.key, []);
    }
    lookup.get(result2.key).push(result);
  }
  for (let [result3, result4] of buildingState.blockSkinMeshes) {
    if (!lookup.has(result3)) {
      result4.count = 0;
    }
  }
  for (let [result5, values] of lookup) {
    let ensureBlockSkinMeshResult = ensureBlockSkinMesh(result5, values.length);
    ensureBlockSkinMeshResult.count = values.length;
    values.forEach((splitValue, value) => {
      let [result6, result7, result8] = splitValue.split(`,`).map(Number);
      buildingState.buildingTransformScratch
        .makeScale(1.002, 1.002, 1.002)
        .setPosition(result6 + 0.5, result7 + 0.5, result8 + 0.5);
      ensureBlockSkinMeshResult.setMatrixAt(value, buildingState.buildingTransformScratch);
    });
    ensureBlockSkinMeshResult.instanceMatrix.needsUpdate = true;
  }
}
