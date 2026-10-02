/** Logical canvas scale, palette conversions, wrapped painting primitives and seamless noise sampling. */
import { clampTextureUnit } from "./clamp-texture-unit.js";
export let smoothTextureRange = (value, value2, value3) => {
  let clampTextureUnitResult = clampTextureUnit((value3 - value) / (value2 - value));
  return clampTextureUnitResult * clampTextureUnitResult * (3 - 2 * clampTextureUnitResult);
};
