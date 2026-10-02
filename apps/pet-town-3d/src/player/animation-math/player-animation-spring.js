/** Scalar interpolation, angle wrapping and spring integration for the player rig. */
export let playerAnimationSpring = class {
  constructor(value = 200, value2 = 14, value3 = 0) {
    this.k = value;
    this.c = value2;
    this.x = value3;
    this.v = 0;
  }
  update(value, value2) {
    if (!(value2 > 0)) {
      return this.x;
    }
    let result = Math.min(60, Math.max(1, Math.ceil(value2 / (1 / 240))));
    let result2 = value2 / result;
    for (let index = 0; index < result; index++) {
      this.v += ((value - this.x) * this.k - this.v * this.c) * result2;
      this.x += this.v * result2;
    }
    return this.x;
  }
};
