import { rebucketVegetationLodField } from "./rebucket-vegetation-lod-field.js";
/** Vegetation state, fixed and level-of-detail instance fields, and water-pass suppression. */
import * as THREE from "three";
import { vegetationState } from "../state.js";
import { hideVegetationForWaterPass } from "./hide-vegetation-for-water-pass.js";
import { restoreVegetationAfterWaterPass } from "./restore-vegetation-after-water-pass.js";
export let VegetationLodField = class {
  constructor(value, value2, value3, value4 = {}) {
    this.name = value;
    this.variants = value2;
    this.mat = value3;
    this.o = {
      kind: `small`,
      ...value4,
    };
    this.items = [];
    this.chunks = [];
  }
  add(value, value2, value3, value4, value5, value6, value7, value8, color, rankValue) {
    let options = {
      field: this,
      v: value % this.variants.length,
      x: value2,
      y: value3,
      z: value4,
      ry: value5,
      rx: 0,
      rz: 0,
      sx: value6,
      sy: value7 ?? value6,
      sz: value8 ?? value6,
      hidden: false,
      kind: `small`,
      rank: rankValue?.rank ?? 0.5,
      m: new Float32Array(16),
      c: color ? [color.r, color.g, color.b] : [1, 1, 1],
      chunk: null,
    };
    this.writeMatrix(options);
    this.items.push(options);
    return options;
  }
  writeMatrix(position) {
    vegetationState.vegetationInstanceEuler.set(position.rx, position.ry, position.rz);
    vegetationState.vegetationInstanceQuaternion.setFromEuler(
      vegetationState.vegetationInstanceEuler,
    );
    vegetationState.vegetationInstanceMatrix.compose(
      vegetationState.vegetationInstancePosition.set(position.x, position.y, position.z),
      vegetationState.vegetationInstanceQuaternion,
      vegetationState.vegetationInstanceScale.set(position.sx, position.sy, position.sz),
    );
    vegetationState.vegetationInstanceMatrix.toArray(position.m);
  }
  build(addValue) {
    let result = this.o.chunk || 32;
    let lookup = new Map();
    for (let position of this.items) {
      let text = `${Math.floor(position.x / result)},${Math.floor(position.z / result)}`;
      if (!lookup.has(text)) {
        lookup.set(text, []);
      }
      lookup.get(text).push(position);
    }
    let length2 = this.variants[0].length;
    for (let result2 of lookup.values()) {
      result2.sort((rankValue, rankValue2) => rankValue.rank - rankValue2.rank);
      let fillResult = Array(this.variants.length).fill(0);
      let result3 = 1 / 0;
      let result4 = -1 / 0;
      let result5 = 1 / 0;
      let result6 = -1 / 0;
      let result7 = 1 / 0;
      let result8 = -1 / 0;
      for (let position2 of result2) {
        fillResult[position2.v]++;
        result3 = Math.min(result3, position2.x);
        result4 = Math.max(result4, position2.x);
        result5 = Math.min(result5, position2.z);
        result6 = Math.max(result6, position2.z);
        result7 = Math.min(result7, position2.y);
        result8 = Math.max(result8, position2.y);
      }
      let options = {
        field: this,
        items: result2,
        meshes: [],
        cx: (result3 + result4) / 2,
        cy: (result7 + result8) / 2,
        cz: (result5 + result6) / 2,
        r: Math.hypot(result4 - result3, result6 - result5) / 2 + 1.5,
        dirty: true,
        camX: 1e9,
        camZ: 1e9,
        camY: 1e9,
        tier: null,
      };
      let sphere = new THREE.Sphere(
        new THREE.Vector3(options.cx, options.cy + 0.5, options.cz),
        Math.hypot(result4 - result3, result8 - result7 + 2, result6 - result5) / 2 + 1.5,
      );
      for (let index = 0; index < this.variants.length; index++) {
        if (((options.meshes[index] = []), fillResult[index])) {
          for (let index2 = 0; index2 < length2; index2++) {
            let instancedMesh = new THREE.InstancedMesh(
              this.variants[index][index2],
              this.mat,
              fillResult[index],
            );
            instancedMesh.name = `veg:${this.name}${index}_l${index2}`;
            instancedMesh.count = 0;
            instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
            instancedMesh.setColorAt(0, vegetationState.vegetationInstanceColor.setRGB(1, 1, 1));
            instancedMesh.instanceColor.setUsage(THREE.DynamicDrawUsage);
            instancedMesh.boundingSphere = sphere;
            instancedMesh.frustumCulled = true;
            instancedMesh.castShadow = false;
            instancedMesh.receiveShadow = true;
            instancedMesh.visible = false;
            Object.assign(instancedMesh.userData, {
              veg: true,
              refract: false,
              reflect: `never`,
              lodChild: true,
            });
            instancedMesh.onBeforeRender = hideVegetationForWaterPass;
            instancedMesh.onAfterRender = restoreVegetationAfterWaterPass;
            addValue.add(instancedMesh);
            options.meshes[index][index2] = instancedMesh;
          }
        }
      }
      for (let result9 of result2) {
        result9.chunk = options;
      }
      this.chunks.push(options);
      vegetationState.vegetationRuntimeState.lodChunks.push(options);
    }
  }
  rebucket(...args) {
    return rebucketVegetationLodField.apply(this, args);
  }
  hide(hiddenValue) {
    if (!hiddenValue.hidden) {
      hiddenValue.hidden = true;
      if (hiddenValue.chunk) {
        hiddenValue.chunk.dirty = true;
      }
    }
  }
  update(chunkValue) {
    this.writeMatrix(chunkValue);
    if (chunkValue.chunk) {
      chunkValue.chunk.dirty = true;
    }
  }
  dispose() {
    for (let result of this.chunks) {
      for (let result2 of result.meshes) {
        for (let result3 of result2) {
          if (result3) {
            result3.removeFromParent();
            result3.dispose();
          }
        }
      }
    }
    this.chunks = [];
  }
  get meshes() {
    let values = [];
    for (let result of this.chunks) {
      for (let result2 of result.meshes) {
        for (let result3 of result2) {
          if (result3) {
            values.push(result3);
          }
        }
      }
    }
    return values;
  }
};
