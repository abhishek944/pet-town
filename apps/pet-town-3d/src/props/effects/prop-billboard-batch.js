/** Cached effect textures, instanced billboards, decals, smoke, campfire particles and pooled lights. */
import * as THREE from "three";
import { propsState } from "../state.js";
export let PropBillboardBatch = class {
  constructor(
    addValue,
    value2,
    value3,
    {
      additive: value4 = false,
      center: value5 = [0.5, 0.5],
      fog: value6 = true,
      renderOrder: value7 = 2,
      name: value8 = `props_billboards`,
      cutout: value9 = 0,
    } = {},
  ) {
    let planeGeometry = new THREE.PlaneGeometry(1, 1);
    let instancedBufferGeometry = new THREE.InstancedBufferGeometry();
    instancedBufferGeometry.index = planeGeometry.index;
    instancedBufferGeometry.setAttribute(`position`, planeGeometry.attributes.position);
    instancedBufferGeometry.setAttribute(`uv`, planeGeometry.attributes.uv);
    this.max = value3;
    this.n = 0;
    this.pos = new THREE.InstancedBufferAttribute(new Float32Array(value3 * 3), 3).setUsage(
      THREE.DynamicDrawUsage,
    );
    this.scl = new THREE.InstancedBufferAttribute(new Float32Array(value3 * 2), 2).setUsage(
      THREE.DynamicDrawUsage,
    );
    this.col = new THREE.InstancedBufferAttribute(new Float32Array(value3 * 4), 4).setUsage(
      THREE.DynamicDrawUsage,
    );
    this.rot = new THREE.InstancedBufferAttribute(new Float32Array(value3), 1).setUsage(
      THREE.DynamicDrawUsage,
    );
    instancedBufferGeometry.setAttribute(`iPos`, this.pos);
    instancedBufferGeometry.setAttribute(`iScale`, this.scl);
    instancedBufferGeometry.setAttribute(`iColor`, this.col);
    instancedBufferGeometry.setAttribute(`iRot`, this.rot);
    instancedBufferGeometry.instanceCount = 0;
    let shaderMaterial = new THREE.ShaderMaterial({
      uniforms: THREE.UniformsUtils.merge([
        THREE.UniformsLib.fog,
        {
          map: {
            value: value2,
          },
          uCenter: {
            value: new THREE.Vector2(...value5),
          },
          uCut: {
            value: value9,
          },
        },
      ]),
      vertexShader: propsState.propBillboardVertexShader,
      fragmentShader: propsState.propBillboardFragmentShader,
      transparent: !value9,
      depthWrite: !!value9,
      fog: value6,
      blending: value4 ? 2 : 1,
    });
    shaderMaterial.uniforms.map.value = value2;
    this.mesh = new THREE.Mesh(instancedBufferGeometry, shaderMaterial);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = value7;
    this.mesh.name = value8;
    addValue.add(this.mesh);
  }
  begin() {
    this.n = 0;
  }
  push(value, value2, value3, value4, value5, value6, value7, value8, value9, value10 = 0) {
    if (this.n >= this.max) {
      return;
    }
    let result = this.n++;
    this.pos.array[result * 3] = value;
    this.pos.array[result * 3 + 1] = value2;
    this.pos.array[result * 3 + 2] = value3;
    this.scl.array[result * 2] = value4;
    this.scl.array[result * 2 + 1] = value5;
    this.col.array[result * 4] = value6;
    this.col.array[result * 4 + 1] = value7;
    this.col.array[result * 4 + 2] = value8;
    this.col.array[result * 4 + 3] = value9;
    this.rot.array[result] = value10;
  }
  commit() {
    let geometry2 = this.mesh.geometry;
    geometry2.instanceCount = this.n;
    for (let result of [this.pos, this.scl, this.col, this.rot]) {
      result.clearUpdateRanges();
      result.addUpdateRange(0, this.n * result.itemSize);
      result.needsUpdate = true;
    }
    this.mesh.visible = this.n > 0;
  }
  dispose() {
    this.mesh.removeFromParent();
    this.mesh.geometry.dispose();
    this.mesh.material.dispose();
  }
};
