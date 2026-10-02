/** Prop interpolation, seeded random and deterministic 3D noise. */
export let PropRandom = class {
  constructor(value = 1) {
    this.s = value >>> 0;
  }
  next() {
    let result = (this.s = (this.s + 1831565813) >>> 0);
    result = Math.imul(result ^ (result >>> 15), result | 1);
    result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  }
  range(value, value2) {
    return value + (value2 - value) * this.next();
  }
  int(value, value2) {
    return Math.floor(this.range(value, value2 + 1));
  }
  pick(values) {
    return values[Math.floor(this.next() * values.length) % values.length];
  }
  chance(value) {
    return this.next() < value;
  }
  sign() {
    return this.next() < 0.5 ? -1 : 1;
  }
};
