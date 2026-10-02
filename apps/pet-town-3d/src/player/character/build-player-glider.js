/** Procedurally constructed Pip model, facial expressions and blended locomotion animation. */
import * as THREE from "three";
import { addPlayerRigGroup } from "../rig-builders/add-player-rig-group.js";
import { addPlayerRigMesh } from "../rig-builders/add-player-rig-mesh.js";
import { createPlayerGliderLeafGeometry } from "../rig-builders/create-player-glider-leaf-geometry.js";
export function buildPlayerGlider(breath, materials, root) {
  let glider = (this.leafRig = addPlayerRigGroup(breath, 0.3, 0.46, 0.02, `leaf`));
  let addPlayerRigMeshResult3 = addPlayerRigMesh(
    glider,
    new THREE.CylinderGeometry(0.018, 0.024, 1, 8),
    materials.stem,
  );
  addPlayerRigMeshResult3.position.y = 0.5;
  let canopy = (this.canopy = addPlayerRigGroup(glider, 0, 1, 0));
  addPlayerRigMesh(canopy, createPlayerGliderLeafGeometry(), materials.leaf);
  glider.rotation.z = 0.3;
  canopy.rotation.z = -0.3;
  glider.scale.setScalar(0.001);
  glider.visible = false;
  root.traverse((isMeshValue) => {
    if (isMeshValue.isMesh) {
      isMeshValue.receiveShadow = false;
    }
  });
}
