/** Cached effect textures, instanced billboards, decals, smoke, campfire particles and pooled lights. */
import * as THREE from "three";
export let PropLightPool = class {
  constructor(addValue, value = 6) {
    this.lights = [];
    for (let index = 0; index < value; index++) {
      let pointLight = new THREE.PointLight(16757350, 0, 9, 1.7);
      pointLight.castShadow = false;
      pointLight.name = `props_lamp_light`;
      pointLight.userData = {
        src: null,
        next: null,
        w: 0,
      };
      addValue.add(pointLight);
      this.lights.push(pointLight);
    }
    this.sources = [];
    this.timer = 0;
  }
  setSources(value) {
    this.sources = value;
    this.timer = 0;
    for (let result of this.lights) {
      result.userData.src = null;
      result.userData.next = null;
      result.userData.w = 0;
    }
  }
  update(value, value2, value3) {
    if (((this.timer -= value), this.timer <= 0)) {
      this.timer = 0.3;
      let result = this.sources
        .map((distanceToSquaredValue) => [
          distanceToSquaredValue,
          distanceToSquaredValue.distanceToSquared(value2),
        ])
        .sort((value4, value5) => value4[1] - value5[1])
        .slice(0, this.lights.length)
        .map((value6) => value6[0]);
      let items = new Set(
        this.lights
          .map((userDataValue) => userDataValue.userData.next ?? userDataValue.userData.src)
          .filter(Boolean),
      );
      let filterResult = result.filter((value7) => !items.has(value7));
      for (let result2 of this.lights) {
        let userData2 = result2.userData;
        let result3 = userData2.next ?? userData2.src;
        if (!(result3 && result.includes(result3))) {
          userData2.next = filterResult.shift() ?? null;
        }
      }
    }
    for (let result4 of this.lights) {
      let userData3 = result4.userData;
      if (userData3.next !== null && userData3.next !== userData3.src) {
        userData3.w = Math.max(0, userData3.w - value * 3);
        if (userData3.w === 0) {
          userData3.src = userData3.next;
          userData3.next = null;
          if (userData3.src) {
            result4.position.copy(userData3.src);
          }
        }
      } else {
        userData3.next = null;
        userData3.w = userData3.src
          ? Math.min(1, userData3.w + value * 2)
          : Math.max(0, userData3.w - value * 3);
      }
      result4.intensity = value3 * 8 * userData3.w;
    }
  }
};
