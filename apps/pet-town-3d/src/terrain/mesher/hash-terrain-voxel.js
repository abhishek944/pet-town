/** Typed buffer growth, beveled chunk construction, grass lip geometry and voxel hashing. */
export function hashTerrainVoxel(value, value2, value3) {
  let result =
    Math.imul(value, 73856093) ^ Math.imul(value2, 19349663) ^ Math.imul(value3, 83492791);
  result = Math.imul(result ^ (result >>> 13), 1274126177);
  return ((result ^ (result >>> 16)) >>> 0) / 4294967296;
}
