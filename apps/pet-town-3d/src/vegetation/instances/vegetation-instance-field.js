/** Vegetation state, fixed and level-of-detail instance fields, and water-pass suppression. */
import * as THREE from "three";
import { vegetationState } from "../state.js";
import { hideVegetationForWaterPass } from "./hide-vegetation-for-water-pass.js";
import { restoreVegetationAfterWaterPass } from "./restore-vegetation-after-water-pass.js";
export let VegetationInstanceField = class {
  constructor(value, value2, value3, value4, value5 = {}) {
    this.name = value;
    this.geo = value2;
    this.mat = value3;
    this.depth = value4;
    this.o = value5;
    this.items = [];
    this.meshes = [];
  }
  add(value, value2, value3, value4, value5, value6, value7, cloneValue, rxValue) {
    let options = {
      field: this,
      x: value,
      y: value2,
      z: value3,
      ry: value4,
      sx: value5,
      sy: value6 ?? value5,
      sz: value7 ?? value5,
      color: cloneValue ? cloneValue.clone() : null,
      rx: rxValue?.rx ?? 0,
      rz: rxValue?.rz ?? 0,
      mesh: null,
      mi: -1,
      hidden: false,
      kind: this.o.kind ?? `small`,
      rank: rxValue?.rank ?? Math.random(),
    };
    this.items.push(options);
    return options;
  }
  matrixOf(position, composeValue) {
    vegetationState.vegetationInstanceEuler.set(position.rx, position.ry, position.rz);
    vegetationState.vegetationInstanceQuaternion.setFromEuler(
      vegetationState.vegetationInstanceEuler,
    );
    return composeValue.compose(
      vegetationState.vegetationInstancePosition.set(position.x, position.y, position.z),
      vegetationState.vegetationInstanceQuaternion,
      vegetationState.vegetationInstanceScale.set(position.sx, position.sy, position.sz),
    );
  }
  build(addValue) {
    if (!this.items.length) {
      return;
    }
    let result = this.o.chunk || 0;
    let lookup = new Map();
    for (let position of this.items) {
      let result2 = result
        ? `${Math.floor(position.x / result)},${Math.floor(position.z / result)}`
        : `0`;
      if (!lookup.has(result2)) {
        lookup.set(result2, []);
      }
      lookup.get(result2).push(position);
    }
    let someResult = this.items.some((colorValue) => colorValue.color);
    for (let values2 of lookup.values()) {
      if (this.o.dens) {
        values2.sort((rankValue, rankValue2) => rankValue.rank - rankValue2.rank);
      }
      let instancedMesh = new THREE.InstancedMesh(this.geo, this.mat, values2.length);
      instancedMesh.name = `veg:` + this.name;
      let result3 = 1 / 0;
      let result4 = -1 / 0;
      let result5 = 1 / 0;
      let result6 = -1 / 0;
      let result7 = 1 / 0;
      let result8 = -1 / 0;
      values2.forEach((position2, value) => {
        instancedMesh.setMatrixAt(
          value,
          position2.hidden
            ? vegetationState.hiddenVegetationMatrix
            : this.matrixOf(position2, vegetationState.vegetationInstanceMatrix),
        );
        if (someResult) {
          instancedMesh.setColorAt(
            value,
            position2.color || vegetationState.vegetationInstanceColor.setRGB(1, 1, 1),
          );
        }
        position2.mesh = instancedMesh;
        position2.mi = value;
        result3 = Math.min(result3, position2.x);
        result4 = Math.max(result4, position2.x);
        result5 = Math.min(result5, position2.z);
        result6 = Math.max(result6, position2.z);
        result7 = Math.min(result7, position2.y);
        result8 = Math.max(result8, position2.y);
      });
      instancedMesh.instanceMatrix.needsUpdate = true;
      if (instancedMesh.instanceColor) {
        instancedMesh.instanceColor.needsUpdate = true;
      }
      instancedMesh.castShadow = !!this.o.cast;
      instancedMesh.receiveShadow = this.o.receive ?? true;
      if (this.depth) {
        instancedMesh.customDepthMaterial = this.depth;
      }
      instancedMesh.computeBoundingSphere();
      if (instancedMesh.boundingSphere) {
        instancedMesh.boundingSphere.radius += this.o.pad ?? 3;
      }
      instancedMesh.renderOrder = this.o.renderOrder ?? 0;
      instancedMesh.frustumCulled = true;
      let userData2 = instancedMesh.userData;
      userData2.veg = true;
      userData2.n = values2.length;
      userData2.lods = this.o.lods || null;
      userData2.lodIdx = 0;
      userData2.geo0 = this.geo;
      userData2.maxDist = this.o.maxDist ?? null;
      userData2.dens = !!this.o.dens;
      userData2.cx = (result3 + result4) / 2;
      userData2.cz = (result5 + result6) / 2;
      userData2.cy = (result7 + result8) / 2;
      userData2.r = Math.hypot(result4 - result3, result6 - result5) / 2 + (this.o.pad ?? 1);
      userData2.refract = this.o.refract ?? false;
      userData2.reflect = this.o.reflect ?? `never`;
      userData2.nearWater =
        !vegetationState.vegetationRuntimeState.ground ||
        vegetationState.vegetationRuntimeState.ground.waterNear(
          result3 - 6,
          result5 - 6,
          result4 + 6,
          result6 + 6,
        );
      userData2.baseCount = values2.length;
      userData2.shadowDist = this.o.shadowDist ?? null;
      instancedMesh.onBeforeRender = hideVegetationForWaterPass;
      instancedMesh.onAfterRender = restoreVegetationAfterWaterPass;
      addValue.add(instancedMesh);
      this.meshes.push(instancedMesh);
      vegetationState.vegetationRuntimeState.chunkMeshes.push(instancedMesh);
    }
  }
  hide(hiddenValue) {
    if (!hiddenValue.hidden) {
      hiddenValue.hidden = true;
      if (hiddenValue.mesh) {
        hiddenValue.mesh.setMatrixAt(hiddenValue.mi, vegetationState.hiddenVegetationMatrix);
        hiddenValue.mesh.instanceMatrix.needsUpdate = true;
      }
    }
  }
  update(meshValue) {
    if (meshValue.mesh && !meshValue.hidden) {
      meshValue.mesh.setMatrixAt(
        meshValue.mi,
        this.matrixOf(meshValue, vegetationState.vegetationInstanceMatrix),
      );
      meshValue.mesh.instanceMatrix.needsUpdate = true;
    }
  }
  dispose() {
    for (let result of this.meshes) {
      result.removeFromParent();
      result.dispose();
    }
    this.meshes = [];
  }
};
