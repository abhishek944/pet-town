/** Logical canvas scale, palette conversions, wrapped painting primitives and seamless noise sampling. */
export let clampTextureUnit = (value) => (value < 0 ? 0 : value > 1 ? 1 : value);
