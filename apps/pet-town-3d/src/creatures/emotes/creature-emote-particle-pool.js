/** Generated expression textures, speech bubbles, sleeping symbols and pooled floating icons. */
import * as THREE from "three";
import { initializeCreatureEmoteMaterials } from "./initialize-creature-emote-materials.js";
import { creaturesState } from "../state.js";
export let creatureEmoteParticlePool = class {
  constructor(addValue, value = 48) {
    initializeCreatureEmoteMaterials();
    this.pool = [];
    this.group = new THREE.Group();
    this.group.name = `creatureIcons`;
    addValue.add(this.group);
    for (let index = 0; index < value; index++) {
      let sprite = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: creaturesState.creatureEmoteIconTextures.heart,
          transparent: true,
          depthWrite: false,
          toneMapped: false,
        }),
      );
      sprite.visible = false;
      sprite.renderOrder = 21;
      sprite.userData = {
        life: 0,
        max: 1,
        v: new THREE.Vector3(),
        ph: 0,
        sz: 0.2,
      };
      this.group.add(sprite);
      this.pool.push(sprite);
    }
    this.i = 0;
  }
  emit(position2, value = `heart`, value2 = 6, value3 = 0.35) {
    for (let index = 0; index < value2; index++) {
      let result = this.pool[this.i++ % this.pool.length];
      result.material.map =
        creaturesState.creatureEmoteIconTextures[value] ??
        creaturesState.creatureEmoteIconTextures.heart;
      result.material.needsUpdate = true;
      result.position.set(
        position2.x + (Math.random() - 0.5) * value3,
        position2.y + Math.random() * 0.15,
        position2.z + (Math.random() - 0.5) * value3,
      );
      let userData2 = result.userData;
      userData2.life = 0;
      userData2.max = 1.1 + Math.random() * 0.7;
      userData2.v.set(
        (Math.random() - 0.5) * 0.9,
        1 + Math.random() * 0.8,
        (Math.random() - 0.5) * 0.9,
      );
      userData2.ph = Math.random() * 6;
      userData2.sz = 0.16 + Math.random() * 0.12;
      userData2.delay = index * 0.05;
      result.visible = true;
      result.scale.setScalar(0.001);
    }
  }
  update(value) {
    for (let result of this.pool) {
      if (!result.visible) {
        continue;
      }
      let userData2 = result.userData;
      if (userData2.delay > 0) {
        userData2.delay -= value;
        continue;
      }
      if (((userData2.life += value), userData2.life > userData2.max)) {
        result.visible = false;
        continue;
      }
      let result2 = userData2.life / userData2.max;
      userData2.v.multiplyScalar(1 - value * 1.6);
      userData2.v.y += value * 0.4;
      result.position.addScaledVector(userData2.v, value);
      result.position.x += Math.sin(userData2.life * 5 + userData2.ph) * value * 0.25;
      let result3 = Math.min(1, userData2.life * 7);
      let result4 = userData2.sz * (result3 < 1 ? result3 * 1.25 : 1) * (1 - result2 * 0.3);
      result.scale.set(result4, result4, 1);
      result.material.opacity = result2 > 0.7 ? 1 - (result2 - 0.7) / 0.3 : 1;
      result.material.rotation = Math.sin(userData2.life * 3 + userData2.ph) * 0.3;
    }
  }
};
