/** Typed buffer growth, beveled chunk construction, grass lip geometry and voxel hashing. */
export function distanceToTerrainSegment(value, value2, value3, value4, value5, value6) {
  let result = value5 - value3;
  let result2 = value6 - value4;
  let result3 = result * result + result2 * result2;
  let result4 = ((value - value3) * result + (value2 - value4) * result2) / result3;
  result4 = result4 < 0 ? 0 : result4 > 1 ? 1 : result4;
  return Math.hypot(value3 + result * result4 - value, value4 + result2 * result4 - value2);
}
