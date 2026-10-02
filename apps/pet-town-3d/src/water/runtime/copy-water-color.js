/** Water lifecycle, terrain rebaking, dynamic reflections/refraction, ripples, splashes, and public water API. */
export function copyWaterColor(vector, copyValue) {
  return vector == null
    ? false
    : vector.isColor
      ? (copyValue.copy(vector), true)
      : vector.isVector3
        ? (copyValue.setRGB(vector.x, vector.y, vector.z), true)
        : typeof vector == `number` || typeof vector == `string`
          ? (copyValue.set(vector), true)
          : false;
}
