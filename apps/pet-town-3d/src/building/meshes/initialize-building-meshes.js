/** Selection and preview meshes, skinned block instances, debris and block animations. */
import * as THREE from "three";
import { buildingState } from "../state.js";
import { createBlockOutlineMaterial } from "../materials/create-block-outline-material.js";
import { createBlockMaterials } from "../materials/create-block-materials.js";
export function initializeBuildingMeshes() {
  buildingState.buildingEffectsGroup = new THREE.Group();
  buildingState.buildingEffectsGroup.name = `building-fx`;
  buildingState.buildingContext.scene.add(buildingState.buildingEffectsGroup);
  buildingState.buildingCubeGeometry = new THREE.BoxGeometry(1, 1, 1);
  buildingState.targetOutlineMesh = new THREE.Mesh(
    buildingState.buildingCubeGeometry,
    createBlockOutlineMaterial(`#ffffff`, 0.036),
  );
  buildingState.targetOutlineMesh.material.uniforms.uGlow.value = 0.3;
  buildingState.targetOutlineMesh.renderOrder = 10;
  buildingState.targetOutlineMesh.scale.setScalar(1.008);
  buildingState.placementGhostMesh = new THREE.Mesh(
    buildingState.buildingCubeGeometry,
    createBlockMaterials(buildingState.resolvedBuildingPalette[0].key, {
      ghost: true,
    }),
  );
  buildingState.placementGhostMesh.renderOrder = 11;
  buildingState.placementOutlineMesh = new THREE.Mesh(
    buildingState.buildingCubeGeometry,
    createBlockOutlineMaterial(`#fff6d6`, 0.04),
  );
  buildingState.placementOutlineMesh.renderOrder = 12;
  buildingState.placementOutlineMesh.material.uniforms.uFill.value = 0;
  buildingState.placementOutlineMesh.material.uniforms.uFace.value.set(0, 0, 0);
  buildingState.placementOutlineMesh.material.uniforms.uGlow.value = 0.12;
  for (let result of [
    buildingState.targetOutlineMesh,
    buildingState.placementGhostMesh,
    buildingState.placementOutlineMesh,
  ]) {
    result.visible = false;
    result.frustumCulled = false;
    buildingState.buildingEffectsGroup.add(result);
  }
  buildingState.blockDebrisMesh = new THREE.InstancedMesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshStandardMaterial({
      roughness: 0.85,
    }),
    160,
  );
  buildingState.blockDebrisMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  buildingState.blockDebrisMesh.count = 0;
  buildingState.blockDebrisMesh.frustumCulled = false;
  buildingState.blockDebrisMesh.castShadow = true;
  buildingState.blockDebrisMesh.setColorAt(0, new THREE.Color());
  buildingState.buildingEffectsGroup.add(buildingState.blockDebrisMesh);
  for (let index = 0; index < 2; index++) {
    let pointLight = new THREE.PointLight(`#ffc36b`, 0, 9, 1.6);
    pointLight.castShadow = false;
    buildingState.buildingEffectsGroup.add(pointLight);
    buildingState.placedLanternLights.push(pointLight);
  }
}
