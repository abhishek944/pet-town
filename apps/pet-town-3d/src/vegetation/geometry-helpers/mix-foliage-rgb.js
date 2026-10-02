/** Foliage color ramps and vertex attributes, geometry buffers, normals and geometry merging. */
export let mixFoliageRgb = (value, value2, value3) => [
  value[0] + (value2[0] - value[0]) * value3,
  value[1] + (value2[1] - value[1]) * value3,
  value[2] + (value2[2] - value[2]) * value3,
];
