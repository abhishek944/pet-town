/** Block selection outlines, face textures and physical materials. */
import * as THREE from "three";
import { buildingState } from "../state.js";
export function createBlockOutlineMaterial(color, lineWidth = 0.045) {
  return new THREE.ShaderMaterial({
    vertexShader: buildingState.blockOutlineVertexShader,
    fragmentShader: buildingState.blockOutlineFragmentShader,
    transparent: true,
    depthWrite: false,
    uniforms: {
      uColor: {
        value: new THREE.Color(color),
      },
      uTime: {
        value: 0,
      },
      uOpacity: {
        value: 1,
      },
      uFill: {
        value: 0,
      },
      uLine: {
        value: lineWidth,
      },
      uGlow: {
        value: 0.5,
      },
      uFace: {
        value: new THREE.Vector3(0, 1, 0),
      },
    },
  });
}
