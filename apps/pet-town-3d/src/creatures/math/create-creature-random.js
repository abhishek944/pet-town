/** Creature interpolation, deterministic random generation, noise and scalar springs. */
export function createCreatureRandom(value = 1) {
  let result = value >>> 0;
  let callback = () => {
    result = (result + 1831565813) >>> 0;
    let resultValue = result;
    resultValue = Math.imul(resultValue ^ (resultValue >>> 15), resultValue | 1);
    resultValue ^= resultValue + Math.imul(resultValue ^ (resultValue >>> 7), resultValue | 61);
    return ((resultValue ^ (resultValue >>> 14)) >>> 0) / 4294967296;
  };
  callback.range = (value2, value3) => value2 + (value3 - value2) * callback();
  callback.int = (value4, value5) => Math.floor(value4 + (value5 - value4 + 1) * callback());
  callback.pick = (values) => values[Math.floor(callback() * values.length)];
  callback.sign = () => (callback() < 0.5 ? -1 : 1);
  return callback;
}
