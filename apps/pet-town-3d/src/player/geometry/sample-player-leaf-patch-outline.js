/** Procedural ellipsoids, iris highlights, tubes, straps, decals, stitched patches and surface projection. */
export function samplePlayerLeafPatchOutline(value, value2, value3 = 22, value4 = 0) {
  let values = [];
  for (let index = 0; index < value3; index++) {
    let result = index / value3;
    let result2 = result < 0.5 ? result * 2 : 2 - result * 2;
    let result3 = result < 0.5 ? 1 : -1;
    let result4 = 0.06 + result2 * 0.88;
    let result5 = (result4 - 0.5) * (value - value4 * 2);
    let result6 =
      result3 *
      Math.max(
        0,
        ((Math.sin(Math.PI * result4) ** 0.8 * value2) / 2) * (1 - 0.25 * result4) - value4,
      );
    values.push([result6, result5]);
  }
  return values;
}
