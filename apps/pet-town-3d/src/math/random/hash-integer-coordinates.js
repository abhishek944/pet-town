/** Deterministic seeded random generation and integer coordinate hashing. */
export function hashIntegerCoordinates(value, value2, value3 = 0) {
  let result =
    (Math.imul(value | 0, 374761393) +
      Math.imul(value2 | 0, 668265263) +
      Math.imul(value3 | 0, 1442695041)) |
    0;
  result = Math.imul(result ^ (result >>> 13), 1274126177);
  result ^= result >>> 16;
  return (result >>> 0) / 4294967296;
}
