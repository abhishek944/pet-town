/** Cached effect textures, instanced billboards, decals, smoke, campfire particles and pooled lights. */
import * as THREE from "three";
import { PropRandom } from "../math/prop-random.js";
import { getFlameParticleTexture } from "./get-flame-particle-texture.js";
import { propsState } from "../state.js";
import { createCampfireFlamePlanes } from "./create-campfire-flame-planes.js";
import { mixPropScalar } from "../math/mix-prop-scalar.js";
import { propValueNoise3d } from "../math/prop-value-noise3d.js";
export let CampfireEmitter = class {
  constructor(position2, positionValue, value2 = 3, addValue = null) {
    this.pos = position2.clone();
    this.rng = new PropRandom(value2);
    this.light = positionValue;
    if (positionValue) {
      positionValue.position.set(position2.x, position2.y + 0.8, position2.z);
      positionValue.distance = 8;
      positionValue.decay = 1.2;
    }
    this.mat = new THREE.ShaderMaterial({
      uniforms: {
        map: {
          value: getFlameParticleTexture(),
        },
        uTime: {
          value: 0,
        },
        uTint: {
          value: new THREE.Color(1, 1, 1),
        },
      },
      vertexShader: propsState.campfireVertexShader,
      fragmentShader: propsState.campfireFragmentShader,
      transparent: false,
      depthWrite: true,
      side: 2,
    });
    this.mesh = new THREE.Mesh(createCampfireFlamePlanes(this.rng), this.mat);
    this.mesh.position.copy(position2);
    this.mesh.scale.setScalar(0.62);
    this.mesh.renderOrder = 3;
    this.mesh.name = `props_fire_planes`;
    this.mesh.frustumCulled = false;
    addValue?.add(this.mesh);
    this.flames = [
      [0, 0.02, 1.5, 0],
      [-0.14, 0.07, 1.05, 1],
      [0.12, -0.08, 0.95, 2],
    ].map(([value3, value4, value5, value6]) => ({
      x: value3,
      z: value4,
      sc: value5,
      ph: this.rng.next() * 10,
      flip: value6 % 2 ? -1 : 1,
    }));
    this.embers = Array.from(
      {
        length: 16,
      },
      () => ({
        age: this.rng.next() * 2,
        life: 1.2 + this.rng.next() * 1.3,
        x: 0,
        z: 0,
        vx: 0,
        vz: 0,
      }),
    );
  }
  update(value2, value3, value4, flameValue) {
    let pos2 = this.pos;
    let mixPropScalarResult = mixPropScalar(0.74, 0.72, value4);
    let mixPropScalarResult2 = mixPropScalar(0.68, 0.62, value4);
    let mixPropScalarResult3 = mixPropScalar(0.36, 0.3, value4);
    this.mat.uniforms.uTime.value = value3;
    this.mat.uniforms.uTint.value.setRGB(
      mixPropScalarResult,
      mixPropScalarResult2,
      mixPropScalarResult3,
    );
    for (let position of this.flames) {
      let propValueNoise3dResult = propValueNoise3d(value3 * 3.4 + position.ph, position.ph, 0);
      let propValueNoise3dResult2 = propValueNoise3d(value3 * 5.1, position.ph + 3, 1);
      let result6 =
        position.sc *
        (0.95 + propValueNoise3dResult * 0.45 + Math.sin(value3 * 11 + position.ph) * 0.05);
      let result7 = position.sc * 0.62 * (0.9 + propValueNoise3dResult2 * 0.2);
      flameValue.flame.push(
        pos2.x + position.x + Math.sin(value3 * 2.1 + position.ph) * 0.02,
        pos2.y + 0.02,
        pos2.z + position.z,
        result7 * position.flip,
        result6,
        mixPropScalarResult,
        mixPropScalarResult2,
        mixPropScalarResult3,
        1,
        Math.sin(value3 * 2.7 + position.ph) * 0.1,
      );
    }
    let result =
      0.75 + 0.25 * propValueNoise3d(value3 * 6, 0.3, 1.7) + 0.08 * Math.sin(value3 * 23);
    if (this.light) {
      this.light.intensity = (4 + 13 * value4) * result;
    }
    let result2 = 2.4 + 0.3 * result;
    let result3 = (0.18 + 0.38 * value4) * result;
    flameValue.glow.push(
      pos2.x,
      pos2.y + 0.45,
      pos2.z,
      result2,
      result2,
      1 * result3,
      0.58 * result3,
      0.1 * result3,
      1,
    );
    let result4 = 0.5 * (0.9 + 0.2 * result);
    let result5 = 0.7 + 0.2 * value4;
    flameValue.glow.push(
      pos2.x,
      pos2.y + 0.28,
      pos2.z,
      result4,
      result4 * 1.3,
      1 * result5,
      0.94 * result5,
      0.69 * result5,
      1,
    );
    for (let position2 of this.embers) {
      position2.age += value2;
      if (position2.age > position2.life) {
        position2.age = 0;
        position2.life = 1.2 + this.rng.next() * 1.3;
        position2.x = this.rng.range(-0.2, 0.2);
        position2.z = this.rng.range(-0.2, 0.2);
        position2.vx = this.rng.range(-0.25, 0.25);
        position2.vz = this.rng.range(-0.25, 0.25);
      }
      let result8 = position2.age / position2.life;
      let result9 = 0.07 * (1 - result8 * 0.6);
      let result10 = Math.min(1, result8 * 8) * (1 - result8);
      flameValue.glow.push(
        pos2.x +
          position2.x +
          position2.vx * position2.age +
          Math.sin(value3 * 4 + position2.life * 9) * 0.06,
        pos2.y + 0.4 + position2.age * 1.1,
        pos2.z + position2.z + position2.vz * position2.age,
        result9,
        result9,
        2.5 * result10,
        1 * result10,
        0.3 * result10,
        1,
      );
    }
  }
};
