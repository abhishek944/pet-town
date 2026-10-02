/** Scalar interpolation helpers shared by island generation. */
export let interpolateTerrainScalar = (value, value2, value3) => value + (value2 - value) * value3;
