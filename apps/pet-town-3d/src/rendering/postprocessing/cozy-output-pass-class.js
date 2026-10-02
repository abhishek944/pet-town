/** Postprocessing pipeline configuration, quality tiers, adaptive quality and render targets. */
import * as THREE from "three";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { renderingState } from "../state.js";
export let cozyOutputPassClass = class extends OutputPass {
  constructor(value2) {
    super();
    this.material.dispose();
    this.uniforms = {
      tDiffuse: {
        value: null,
      },
      toneMappingExposure: {
        value: 1,
      },
      ...value2,
    };
    this.material = new THREE.RawShaderMaterial({
      name: `CozyOutputShader`,
      uniforms: this.uniforms,
      vertexShader: renderingState.colorGradeOutputVertexShader,
      fragmentShader: renderingState.colorGradeOutputFragmentShader,
      depthTest: false,
      depthWrite: false,
    });
    this._fsQuad.material = this.material;
    this._toneMapping = null;
  }
};
