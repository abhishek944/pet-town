/** UV generation, transform composition, vertex color baking and material-batched geometry builder. */
import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
export function assemblePropMaterialMeshes(value, { shadows: value2 = true } = {}) {
  let group = new THREE.Group();
  let lookup = new Map();
  for (let [result, values] of this.buckets) {
    if (!values.length) {
      continue;
    }
    let result2 = value[result];
    if (!result2) {
      console.warn(`[props] missing material`, result);
      continue;
    }
    let mergeGeometriesResult = mergeGeometries(values, false);
    if (!mergeGeometriesResult) {
      continue;
    }
    mergeGeometriesResult.computeBoundingSphere();
    mergeGeometriesResult.computeBoundingBox();
    let mesh2 = new THREE.Mesh(mergeGeometriesResult, result2);
    mesh2.name = `props_` + result;
    mesh2.castShadow = value2 && !result2.userData.noShadow;
    mesh2.receiveShadow = value2;
    group.add(mesh2);
    let result3 = this.tags.get(result);
    let index = 0;
    values.forEach((attributesValue, value3) => {
      let count2 = attributesValue.attributes.position.count;
      let result4 = result3[value3];
      if (result4 != null) {
        let values2 = lookup.get(result4);
        if (!values2) {
          lookup.set(result4, (values2 = []));
        }
        let result5 = values2[values2.length - 1];
        if (result5 && result5.mesh === mesh2 && result5.start + result5.count === index) {
          result5.count += count2;
        } else {
          values2.push({
            mesh: mesh2,
            start: index,
            count: count2,
          });
        }
      }
      index += count2;
      attributesValue.dispose();
    });
  }
  this.buckets.clear();
  this.tags.clear();
  group.userData.ranges = lookup;
  return group;
}
