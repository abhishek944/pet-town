/** Deterministic seeded random generation and integer coordinate hashing. */
export function createSeededRandom(value) {
  let result = value >>> 0;
  return function () {
    result = (result + 1831565813) >>> 0;
    let resultValue = result;
    resultValue = Math.imul(resultValue ^ (resultValue >>> 15), resultValue | 1);
    resultValue ^= resultValue + Math.imul(resultValue ^ (resultValue >>> 7), resultValue | 61);
    return ((resultValue ^ (resultValue >>> 14)) >>> 0) / 4294967296;
  };
}
