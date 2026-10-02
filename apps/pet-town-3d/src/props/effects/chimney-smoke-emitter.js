/** Cached effect textures, instanced billboards, decals, smoke, campfire particles and pooled lights. */
import { PropRandom } from "../math/prop-random.js";
import { mixPropScalar } from "../math/mix-prop-scalar.js";
import { propEffectEase } from "./prop-effect-ease.js";
export let ChimneySmokeEmitter = class {
  constructor(cloneValue, value = 1, value2 = 14) {
    this.origin = cloneValue.clone();
    this.rng = new PropRandom(value);
    this.p = [];
    for (let index = 0; index < value2; index++) {
      this.p.push({
        age: (index / value2) * 4.6,
        life: 4.2 + this.rng.next() * 1.2,
        rot: this.rng.range(-0.4, 0.4),
        dx: this.rng.range(-0.15, 0.15),
        dz: this.rng.range(-0.15, 0.15),
      });
    }
  }
  update(value, value2, value3, smokeValue) {
    let result = 0.35 + 0.15 * Math.sin(value2 * 0.13);
    let mixPropScalarResult = mixPropScalar(0.97, 0.16, value3);
    let result2 = mixPropScalarResult * mixPropScalar(1, 0.86, value3);
    let result3 = mixPropScalarResult * mixPropScalar(0.985, 0.92, value3);
    let result4 = mixPropScalarResult * mixPropScalar(0.97, 1.12, value3);
    for (let result5 of this.p) {
      result5.age += value;
      if (result5.age > result5.life) {
        result5.age -= result5.life;
        result5.life = 4.2 + this.rng.next() * 1.2;
        result5.dx = this.rng.range(-0.15, 0.15);
        result5.dz = this.rng.range(-0.15, 0.15);
      }
      let result6 = result5.age / result5.life;
      let result7 = result5.age * 0.75 - result5.age * result5.age * 0.035;
      let result8 = Math.sin(value2 * 0.9 + result5.rot * 10) * 0.15 * result6;
      let mixPropScalarResult2 = mixPropScalar(0.3, 2.4, result6 ** 0.7);
      let result9 =
        propEffectEase(result6 / 0.14) * (1 - result6) ** 1.4 * mixPropScalar(0.6, 0.45, value3);
      smokeValue.smoke.push(
        this.origin.x + result5.dx + result * result5.age * result6 + result8,
        this.origin.y + result7,
        this.origin.z + result5.dz + 0.12 * result5.age * result6,
        mixPropScalarResult2,
        mixPropScalarResult2,
        result2,
        result3,
        result4,
        result9,
        result5.rot * value2 * 0.3 + result5.rot * 5,
      );
    }
  }
};
