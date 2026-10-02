/** Prop lifecycle, collision and interaction API, terrain reseating, static batches and animated prop effects. */
export function samplePropFoundationHeight(hValue, value, value2, value3, value4) {
  let values = [
    hValue.h(value, value2),
    hValue.h(value + value3, value2),
    hValue.h(value - value3, value2),
    hValue.h(value, value2 + value3),
    hValue.h(value, value2 - value3),
  ];
  if (value4 === `min`) {
    return Math.min(...values);
  }
  let result = values[0];
  let result2 = Math.max(...values);
  return result2 - result <= 0.5 ? result2 : result;
}
