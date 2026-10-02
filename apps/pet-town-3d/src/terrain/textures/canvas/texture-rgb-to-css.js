/** Logical canvas scale, palette conversions, wrapped painting primitives and seamless noise sampling. */
export let textureRgbToCss = (value, value2 = 1) =>
  `rgba(${value[0] | 0},${value[1] | 0},${value[2] | 0},${value2})`;
