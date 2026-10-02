/** Logical canvas scale, palette conversions, wrapped painting primitives and seamless noise sampling. */
export let interpolateTextureRgb = (value, value2, value3) => [
  value[0] + (value2[0] - value[0]) * value3,
  value[1] + (value2[1] - value[1]) * value3,
  value[2] + (value2[2] - value[2]) * value3,
];
