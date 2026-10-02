/** Scalar interpolation helpers shared by island generation. */
export let clampTerrainScalar = (value, value2, value3) =>
  value < value2 ? value2 : value > value3 ? value3 : value;
