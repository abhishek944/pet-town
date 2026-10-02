/** Shared CPU and GLSL swell wave parameters and height sampling. */
export let formatWaterGlslNumber = (toFixedValue) =>
  Number.isInteger(toFixedValue) ? toFixedValue.toFixed(1) : String(+toFixedValue.toFixed(6));
