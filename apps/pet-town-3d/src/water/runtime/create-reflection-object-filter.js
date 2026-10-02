/** Water lifecycle, terrain rebaking, dynamic reflections/refraction, ripples, splashes, and public water API. */
import * as THREE from "three";
export function createReflectionObjectFilter(state) {
  return (traverseValue) => {
    if (state.reflectAll) {
      state.reflectionHiddenObjects = [state.mesh];
      traverseValue.traverse((isInstancedMeshValue) => {
        if (
          isInstancedMeshValue.isInstancedMesh &&
          isInstancedMeshValue !== state.mesh &&
          (isInstancedMeshValue.count > 1500 ||
            /grass|flower|fl_|tall/i.test(isInstancedMeshValue.name))
        ) {
          state.reflectionHiddenObjects.push(isInstancedMeshValue);
        }
      });
      if (!state.reflectClouds && state.context.sky?.clouds?.mesh?.isObject3D) {
        state.reflectionHiddenObjects.push(state.context.sky.clouds.mesh);
      }
      return;
    }
    let items = new Set(
      [
        state.context.terrain?.group,
        state.context.sky?.group,
        state.context.vegetation?.group,
        state.context.props?.group,
      ].filter(Boolean),
    );
    state.reflectionHiddenObjects = [state.mesh];
    for (let result26 of traverseValue.children) {
      if (!(
        result26 === state.mesh ||
        result26.isLight ||
        items.has(result26) ||
        state.reflectionGroupPattern.test(result26.name)
      )) {
        if (result26.type !== `Object3D` || result26.children.length !== 0) {
          state.reflectionHiddenObjects.push(result26);
        }
      }
    }
    let box3 = new THREE.Box3();
    state.context.terrain?.group?.traverse((isMeshValue) => {
      if (isMeshValue.isMesh && isMeshValue.geometry) {
        if (!isMeshValue.geometry.boundingBox) {
          isMeshValue.geometry.computeBoundingBox();
        }
        box3.copy(isMeshValue.geometry.boundingBox).applyMatrix4(isMeshValue.matrixWorld);
        if (box3.max.y < state.surfaceY + 0.05) {
          state.reflectionHiddenObjects.push(isMeshValue);
        }
      }
    });
    let group2 = state.context.vegetation?.group;
    if (group2) {
      group2.traverse((isMeshValue2) => {
        if (
          isMeshValue2.isMesh &&
          !state.reflectionVegetationPattern.test(isMeshValue2.name || ``)
        ) {
          state.reflectionHiddenObjects.push(isMeshValue2);
        }
      });
    } else {
      traverseValue.traverse((isInstancedMeshValue2) => {
        if (
          isInstancedMeshValue2.isInstancedMesh &&
          isInstancedMeshValue2 !== state.mesh &&
          (isInstancedMeshValue2.count > 1500 ||
            /grass|flower|fl_|tall/i.test(isInstancedMeshValue2.name))
        ) {
          state.reflectionHiddenObjects.push(isInstancedMeshValue2);
        }
      });
    }
    if (!state.reflectClouds && state.context.sky?.clouds?.mesh?.isObject3D) {
      state.reflectionHiddenObjects.push(state.context.sky.clouds.mesh);
    }
  };
}
