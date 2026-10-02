/** Prop interpolation, seeded random and deterministic 3D noise. */
export function propHash3d(value, value2, value3) {
  let result = (value * 374761393 + value2 * 668265263 + value3 * 2147483647) | 0;
  result = Math.imul(result ^ (result >>> 13), 1274126177);
  result ^= result >>> 16;
  return (result >>> 0) / 4294967296;
}
