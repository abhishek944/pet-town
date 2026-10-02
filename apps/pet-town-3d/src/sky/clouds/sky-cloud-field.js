/** Instanced cloud puff shaders, generation, wind drift and transparent depth sorting. */
import * as THREE from "three";
import { skyState } from "../state.js";
export let skyCloudField = class {
  constructor(value, { count: value2 = 72, domain: value3 = 7600, seed: value4 = 7 } = {}) {
    this.domain = value3;
    this.wind = new THREE.Vector3(1, 0, 0.35).normalize().multiplyScalar(7);
    let result = value4 * 9973 + 17;
    let callback = () => (result = (result * 16807) % 2147483647) / 2147483647;
    this.clouds = [];
    let values = [];
    for (let index = 0; index < value2; index++) {
      let result2 = 200 + callback() ** 1.3 * 520;
      let result3 =
        result2 * (callback() < 0.3 ? 0.55 + callback() * 0.2 : 0.3 + callback() * 0.18);
      let result4 = result2 * (0.5 + callback() * 0.25);
      let options = {
        x: (callback() - 0.5) * value3,
        z: (callback() - 0.5) * value3,
        y: 200 + callback() * 150,
        W: result2,
        H: result3,
        D: result4,
        seed: callback(),
        cx: 0,
        cz: 0,
        fade: 1,
        first: values.length,
      };
      let result5 = Math.round(8 + result2 / 30 + callback() * 5);
      let result6 = Math.max(3, Math.round(result5 * 0.3));
      for (let index2 = 0; index2 < result6; index2++) {
        let result7 = (index2 / (result6 - 1)) * 2 - 1;
        let result8 = result3 * (0.36 + callback() * 0.12) * (1 - 0.35 * Math.abs(result7));
        values.push({
          cloud: options,
          ox: result7 * result2 * 0.42,
          oy: result8 * 0.55,
          oz: (callback() - 0.5) * result4 * 0.5,
          r: result8,
          seed: callback(),
        });
      }
      for (let result6Value = result6; result6Value < result5; result6Value++) {
        let result9 = (callback() * 2 - 1) * 0.85;
        let result10 = (callback() * 2 - 1) * 0.7;
        let result11 = Math.max(0, 1 - (result9 * result9 + result10 * result10 * 0.6));
        let result12 = result3 * (0.26 + callback() * 0.18) * (0.65 + 0.55 * result11);
        let result13 = result12 * 0.6 + result11 * result3 * (0.25 + callback() * 0.5);
        values.push({
          cloud: options,
          ox: result9 * result2 * 0.45,
          oy: result13,
          oz: result10 * result4 * 0.45,
          r: result12,
          seed: callback(),
        });
      }
      values.push({
        cloud: options,
        ox: (callback() - 0.5) * result2 * 0.2,
        oy: result3 * (0.7 + callback() * 0.25),
        oz: (callback() - 0.5) * result4 * 0.2,
        r: result3 * (0.38 + callback() * 0.1),
        seed: callback(),
      });
      options.count = values.length - options.first;
      this.clouds.push(options);
    }
    this.puffs = values;
    let length2 = values.length;
    this.N = length2;
    let instancedBufferGeometry = new THREE.InstancedBufferGeometry();
    instancedBufferGeometry.setAttribute(
      `position`,
      new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0]), 3),
    );
    instancedBufferGeometry.setIndex([0, 1, 2, 0, 2, 3]);
    this.aPuff = new THREE.InstancedBufferAttribute(new Float32Array(length2 * 4), 4).setUsage(
      THREE.DynamicDrawUsage,
    );
    this.aCloud = new THREE.InstancedBufferAttribute(new Float32Array(length2 * 4), 4).setUsage(
      THREE.DynamicDrawUsage,
    );
    this.aShape = new THREE.InstancedBufferAttribute(new Float32Array(length2 * 4), 4).setUsage(
      THREE.DynamicDrawUsage,
    );
    instancedBufferGeometry.setAttribute(`iPuff`, this.aPuff);
    instancedBufferGeometry.setAttribute(`iCloud`, this.aCloud);
    instancedBufferGeometry.setAttribute(`iShape`, this.aShape);
    instancedBufferGeometry.instanceCount = length2;
    this.order = new Uint32Array(length2).map((value5, value6) => value6);
    this.depth = new Float32Array(length2);
    this.mat = new THREE.ShaderMaterial({
      uniforms: value,
      vertexShader: skyState.skyCloudsVertexShader,
      fragmentShader: skyState.skyCloudsFragmentShader,
      transparent: true,
      depthWrite: false,
      depthTest: true,
      fog: false,
    });
    this.mesh = new THREE.Mesh(instancedBufferGeometry, this.mat);
    this.mesh.name = `skyClouds`;
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = -999;
    this.mesh.matrixAutoUpdate = false;
    this._fwd = new THREE.Vector3();
  }
  update(value, positionValue) {
    let domain2 = this.domain;
    let result = domain2 / 2;
    let position2 = positionValue.position;
    for (let position3 of this.clouds) {
      position3.x += this.wind.x * value;
      position3.z += this.wind.z * value;
      let result2 = position3.x - position2.x;
      let result3 = position3.z - position2.z;
      result2 -= domain2 * Math.round(result2 / domain2);
      result3 -= domain2 * Math.round(result3 / domain2);
      position3.cx = position2.x + result2;
      position3.cz = position2.z + result3;
      let result4 = Math.max(Math.abs(result2), Math.abs(result3));
      position3.fade = 1 - THREE.MathUtils.smoothstep(result4, result * 0.8, result * 0.97);
    }
    let worldDirectionResult = positionValue.getWorldDirection(this._fwd);
    let puffs2 = this.puffs;
    let depth2 = this.depth;
    for (let index = 0; index < this.N; index++) {
      let result5 = puffs2[index];
      let cloud2 = result5.cloud;
      depth2[index] =
        (cloud2.cx + result5.ox - position2.x) * worldDirectionResult.x +
        (cloud2.y + result5.oy - position2.y) * worldDirectionResult.y +
        (cloud2.cz + result5.oz - position2.z) * worldDirectionResult.z;
    }
    let order2 = this.order;
    order2.sort((value2, value3) => depth2[value3] - depth2[value2]);
    let array2 = this.aPuff.array;
    let array3 = this.aCloud.array;
    let array4 = this.aShape.array;
    for (let index2 = 0; index2 < this.N; index2++) {
      let result6 = puffs2[order2[index2]];
      let cloud3 = result6.cloud;
      let result7 = index2 * 4;
      array2[result7] = cloud3.cx + result6.ox;
      array2[result7 + 1] = cloud3.y + result6.oy;
      array2[result7 + 2] = cloud3.cz + result6.oz;
      array2[result7 + 3] = result6.r;
      array3[result7] = cloud3.cx;
      array3[result7 + 1] = cloud3.y;
      array3[result7 + 2] = cloud3.cz;
      array3[result7 + 3] = result6.seed;
      array4[result7] = cloud3.W * 0.5;
      array4[result7 + 1] = cloud3.H;
      array4[result7 + 2] = cloud3.D * 0.5;
      array4[result7 + 3] = cloud3.fade;
    }
    this.aPuff.needsUpdate = this.aCloud.needsUpdate = this.aShape.needsUpdate = true;
  }
};
