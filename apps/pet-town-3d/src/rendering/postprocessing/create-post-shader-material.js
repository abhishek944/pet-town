/** Postprocessing pipeline configuration, quality tiers, adaptive quality and render targets. */
import * as THREE from "three";
import { renderingState } from "../state.js";
export let createPostShaderMaterial = (fragmentShader, uniforms, defines = {}) =>
  new THREE.ShaderMaterial({
    vertexShader: renderingState.fullscreenVertexShader,
    fragmentShader: fragmentShader,
    uniforms: uniforms,
    defines: defines,
    depthTest: false,
    depthWrite: false,
    blending: 0,
  });
