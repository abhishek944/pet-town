/** Sky dome mesh construction. */
import * as THREE from "three";
import { skyState } from "../state.js";
export function createSkyDome(value) {
  let shaderMaterial = new THREE.ShaderMaterial({
    uniforms: value,
    vertexShader: skyState.skyDomeVertexShader,
    fragmentShader: skyState.skyDomeFragmentShader,
    depthWrite: false,
    depthTest: true,
    side: 1,
    fog: false,
    toneMapped: true,
  });
  let mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 40), shaderMaterial);
  mesh.name = `skyDome`;
  mesh.frustumCulled = false;
  mesh.renderOrder = -1e3;
  mesh.matrixAutoUpdate = false;
  return mesh;
}
