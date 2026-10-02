/** Scalar interpolation helpers shared by island generation. */
import { clampTerrainScalar } from "./clamp-terrain-scalar.js";
export let smoothTerrainScalar = (value, value2, value3) => {
  let clampTerrainScalarResult = clampTerrainScalar((value3 - value) / (value2 - value), 0, 1);
  return clampTerrainScalarResult * clampTerrainScalarResult * (3 - 2 * clampTerrainScalarResult);
};
