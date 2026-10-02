/** Generated expression textures, speech bubbles, sleeping symbols and pooled floating icons. */
import * as THREE from "three";
import { initializeCreatureEmoteMaterials } from "./initialize-creature-emote-materials.js";
import { creaturesState } from "../state.js";
import { smoothstepCreatureEmoteValue } from "./smoothstep-creature-emote-value.js";
export let creatureEmoteBubble = class {
  constructor(addValue, value, value2 = value * 0.8) {
    initializeCreatureEmoteMaterials();
    this.height = value;
    this.headY = value2;
    this.mat = new THREE.SpriteMaterial({
      map: creaturesState.creatureEmoteBubbleMaterials.heart.map,
      depthWrite: false,
      transparent: true,
      toneMapped: false,
    });
    this.sprite = new THREE.Sprite(this.mat);
    this.sprite.visible = false;
    this.sprite.renderOrder = 20;
    this.sprite.center.set(0.5, 0.08);
    addValue.add(this.sprite);
    this.kind = null;
    this.t = 0;
    this.dur = 0;
    this.scale = 0;
    this.sv = 0;
    this.zOn = false;
    this.zParent = addValue;
    this.z = null;
    this.zp = Math.random();
    this.zAlpha = 0;
  }
  show(value, value2 = 1.8) {
    if (creaturesState.creatureEmoteBubbleMaterials[value]) {
      this.kind = value;
      this.mat.map = creaturesState.creatureEmoteBubbleMaterials[value].map;
      this.t = 0;
      this.dur = value2;
      this.sprite.visible = true;
      this.scale = 0;
      this.sv = 6;
    }
  }
  get busy() {
    return this.kind !== null;
  }
  setSleeping(value) {
    this.zOn = value;
    if (value && !this.z) {
      this.z = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: creaturesState.creatureSleepTexture,
          depthWrite: false,
          transparent: true,
          toneMapped: false,
          opacity: 0,
        }),
      );
      this.z.renderOrder = 20;
      this.z.center.set(0.3, 0.2);
      this.zParent.add(this.z);
    }
  }
  update(value, position2, value2 = 0) {
    let sprite2 = this.sprite;
    if (this.kind) {
      this.t += value;
      let result = +(this.t < this.dur);
      this.sv += (220 * (result - this.scale) - 16 * this.sv) * value;
      this.scale += this.sv * value;
      if (this.t > this.dur && this.scale < 0.05) {
        this.kind = null;
        sprite2.visible = false;
      }
      let result2 = Math.max(0, this.scale) * 0.62;
      sprite2.scale.set(result2, result2, 1);
      sprite2.position.set(
        position2.x + 0.16,
        position2.y + 0.12 + Math.sin(this.t * 3) * 0.02,
        position2.z,
      );
      this.mat.rotation = Math.sin(this.t * 4) * 0.05;
      this.mat.opacity =
        1 -
        smoothstepCreatureEmoteValue(
          creaturesState.creatureBubbleFadeStart,
          creaturesState.creatureBubbleFadeEnd,
          value2,
        );
      sprite2.visible = this.kind !== null && this.mat.opacity > 0.01;
    }
    if (this.z) {
      let result3 =
        1 -
        smoothstepCreatureEmoteValue(
          creaturesState.creatureSleepFadeStart,
          creaturesState.creatureSleepFadeEnd,
          value2,
        );
      this.zAlpha += ((this.zOn ? result3 : 0) - this.zAlpha) * Math.min(1, value * 3);
      let z2 = this.z;
      if (((z2.visible = this.zAlpha > 0.01), z2.visible)) {
        this.zp = (this.zp + value * 0.28) % 1;
        let zp2 = this.zp;
        z2.material.opacity = this.zAlpha * Math.min(1, Math.sin(zp2 * Math.PI) * 1.6);
        let result4 = 0.2 + zp2 * 0.06;
        z2.scale.set(result4 * 1.5, result4, 1);
        z2.position.set(
          position2.x + 0.12 + zp2 * 0.06,
          this.headY + 0.1 + zp2 * 0.16,
          position2.z,
        );
        z2.material.rotation = -0.15 + Math.sin(zp2 * 5) * 0.08;
      }
    }
  }
};
