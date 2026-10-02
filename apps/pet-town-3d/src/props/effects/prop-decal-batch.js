/** Cached effect textures, instanced billboards, decals, smoke, campfire particles and pooled lights. */
import { PropBillboardBatch } from "./prop-billboard-batch.js";
import { propsState } from "../state.js";
export let PropDecalBatch = class extends PropBillboardBatch {
  constructor(
    value2,
    value3,
    value4,
    { additive: value5 = true, name: value6 = `props_decals`, renderOrder: value7 = 1 } = {},
  ) {
    super(value2, value3, value4, {
      additive: value5,
      name: value6,
      renderOrder: value7,
      fog: false,
    });
    let material2 = this.mesh.material;
    material2.vertexShader = propsState.propDecalVertexShader;
    material2.fragmentShader = propsState.propDecalFragmentShader;
    material2.uniforms.uAmp = {
      value: 1,
    };
    material2.fog = false;
    material2.polygonOffset = true;
    material2.polygonOffsetFactor = -2;
    material2.polygonOffsetUnits = -2;
    if (!value5) {
      material2.blending = 1;
    }
    material2.needsUpdate = true;
  }
  set amp(value2) {
    this.mesh.material.uniforms.uAmp.value = value2;
    this.mesh.visible = value2 > 0.003 && this.n > 0;
  }
};
