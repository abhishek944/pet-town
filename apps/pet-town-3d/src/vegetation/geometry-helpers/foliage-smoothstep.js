/** Foliage color ramps and vertex attributes, geometry buffers, normals and geometry merging. */
import { clampFoliageUnit } from "./clamp-foliage-unit.js";
export let foliageSmoothstep = (value, value2, value3) => {
  let clampFoliageUnitResult = clampFoliageUnit((value3 - value) / (value2 - value));
  return clampFoliageUnitResult * clampFoliageUnitResult * (3 - 2 * clampFoliageUnitResult);
};
