/** Selection and preview meshes, skinned block instances, debris and block animations. */
import * as THREE from "three";
import { buildingState } from "../state.js";
import { createBlockMaterials } from "../materials/create-block-materials.js";
export function createBlockAnimation(kind, x, y, z, key) {
  let mesh2 = new THREE.Mesh(
    buildingState.buildingCubeGeometry,
    createBlockMaterials(key, {
      skin: true,
    }),
  );
  mesh2.position.set(x + 0.5, y + 0.5, z + 0.5);
  mesh2.castShadow = true;
  mesh2.scale.setScalar(kind === `pop` ? 0.3 : 1.004);
  buildingState.buildingEffectsGroup.add(mesh2);
  buildingState.blockAnimationInstances.push({
    kind: kind,
    mesh: mesh2,
    t: 0,
    dur: kind === `pop` ? 0.26 : 0.2,
    spin: (Math.random() - 0.5) * 2,
  });
}
