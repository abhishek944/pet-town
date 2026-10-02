/** Logical canvas scale, palette conversions, wrapped painting primitives and seamless noise sampling. */
export let hexToTextureRgb = (value) => [(value >> 16) & 255, (value >> 8) & 255, value & 255];
