/** Deterministic random streams, hashes, value noise and interpolation for vegetation placement and geometry. */
import { clampVegetationValue } from "./clamp-vegetation-value.js";
export let vegetationSmoothstep = (value, value2, value3) => {
  let clampVegetationValueResult = clampVegetationValue((value3 - value) / (value2 - value), 0, 1);
  return (
    clampVegetationValueResult * clampVegetationValueResult * (3 - 2 * clampVegetationValueResult)
  );
};
