/** Foliage color ramps and vertex attributes, geometry buffers, normals and geometry merging. */
export let multiplyFoliageRgb = (value, value2) => [
  value[0] * value2,
  value[1] * value2,
  value[2] * value2,
];
