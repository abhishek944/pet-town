/** Logical canvas scale, palette conversions, wrapped painting primitives and seamless noise sampling. */
export let pickTexturePaletteColor = (value, values) => values[Math.floor(value() * values.length)];
