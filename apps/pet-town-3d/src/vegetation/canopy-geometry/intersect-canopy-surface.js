/** Canopy surface intersections, rounded clumps and silhouette fringe cards. */
import * as THREE from "three";
import { mergeFoliageGeometry } from "../geometry-helpers/merge-foliage-geometry.js";
import { vegetationState } from "../state.js";
export function intersectCanopySurface(mapValue, cloneValue, cloneValue2) {
  let mesh = new THREE.Mesh(
    mergeFoliageGeometry(
      mapValue.map((attributesValue) => {
        let geometry2 = new THREE.BufferGeometry();
        geometry2.setAttribute(`position`, attributesValue.attributes.position);
        geometry2.setIndex(attributesValue.index);
        return geometry2;
      }),
    ),
  );
  mesh.material.side = 2;
  vegetationState.canopySurfaceRaycaster.set(
    cloneValue.clone().addScaledVector(cloneValue2, 20),
    cloneValue2.clone().negate(),
  );
  let result = vegetationState.canopySurfaceRaycaster.intersectObject(mesh, false)[0];
  if ((mesh.geometry.dispose(), !result)) {
    return null;
  }
  let result2 = result.face ? result.face.normal.clone() : cloneValue2.clone();
  if (result2.dot(cloneValue2) < 0) {
    result2.negate();
  }
  return {
    p: result.point,
    n: result2,
  };
}
