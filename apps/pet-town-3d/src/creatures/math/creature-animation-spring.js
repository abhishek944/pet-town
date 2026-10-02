/** Creature interpolation, deterministic random generation, noise and scalar springs. */
export let creatureAnimationSpring = class {
  constructor(value = 160, value2 = 14, value3 = 0) {
    this.k = value;
    this.d = value2;
    this.x = value3;
    this.v = 0;
  }
  step(value, value2) {
    let result = value2 > 1 / 90 ? Math.ceil(value2 * 90) : 1;
    let result2 = value2 / result;
    for (let index = 0; index < result; index++) {
      this.v += (this.k * (value - this.x) - this.d * this.v) * result2;
      this.x += this.v * result2;
    }
    return this.x;
  }
  kick(value) {
    this.v += value;
  }
};
