/** Sun elevation and day, golden-hour and night weights for effects. */
export function sampleFxSunElevation(context) {
  if (typeof context.sky?.sunElevation == `number`) {
    return context.sky.sunElevation;
  }
  let result = context.params?.get?.(`postT`);
  let result2 = result == null ? context.timeOfDay : parseFloat(result);
  if (typeof result2 == `number` && !Number.isNaN(result2)) {
    return -Math.cos(result2 * Math.PI * 2);
  }
  if (context.sun) {
    let position2 = context.sun.position;
    let position3 = context.sun.target?.position ?? {
      x: 0,
      y: 0,
      z: 0,
    };
    let result3 = position2.x - position3.x;
    let result4 = position2.y - position3.y;
    let result5 = position2.z - position3.z;
    return result4 / (Math.hypot(result3, result4, result5) || 1);
  }
  return 0.8;
}
