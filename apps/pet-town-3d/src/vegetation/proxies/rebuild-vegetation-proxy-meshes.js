/** Merged reflection and shadow proxy meshes with removable vertex ranges. */
import { vegetationState } from "../state.js";
import { VegetationInstanceField } from "../instances/vegetation-instance-field.js";
import { buildVegetationProxyMesh } from "./build-vegetation-proxy-mesh.js";
export function rebuildVegetationProxyMeshes() {
  for (let result of [`proxyShadow`, `proxyRefl`]) {
    if (vegetationState.vegetationRuntimeState[result]) {
      vegetationState.vegetationRuntimeState[result].removeFromParent();
      vegetationState.vegetationRuntimeState[result].geometry.dispose();
      vegetationState.vegetationRuntimeState[result] = null;
    }
  }
  let values2 = [];
  for (let result2 of Object.values(vegetationState.vegetationRuntimeState.fields)) {
    if (result2 instanceof VegetationInstanceField) {
      for (let result3 of result2.items) {
        if (result3.proxyGeos && !result3.hidden) {
          values2.push(result3);
        }
      }
    }
  }
  let ground2 = vegetationState.vegetationRuntimeState.ground;
  vegetationState.vegetationRuntimeState.proxyShadow = buildVegetationProxyMesh(
    values2,
    `shadow`,
    (shadowGeosValue) => shadowGeosValue.shadowGeos || shadowGeosValue.proxyGeos,
  );
  vegetationState.vegetationRuntimeState.proxyRefl = buildVegetationProxyMesh(
    values2.filter((position) =>
      ground2.waterNear(position.x - 7, position.z - 7, position.x + 7, position.z + 7),
    ),
    `refl`,
    (shadowGeosValue2) => shadowGeosValue2.shadowGeos || shadowGeosValue2.proxyGeos,
  );
}
