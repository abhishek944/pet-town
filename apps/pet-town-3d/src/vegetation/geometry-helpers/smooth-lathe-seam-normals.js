/** Foliage color ramps and vertex attributes, geometry buffers, normals and geometry merging. */
export function smoothLatheSeamNormals(attributesValue, value, value2) {
  let normal2 = attributesValue.attributes.normal;
  for (let index = 0; index < value2; index++) {
    let indexValue = index;
    let result = value * value2 + index;
    let result2 = normal2.getX(indexValue) + normal2.getX(result);
    let result3 = normal2.getY(indexValue) + normal2.getY(result);
    let result4 = normal2.getZ(indexValue) + normal2.getZ(result);
    let result5 = Math.hypot(result2, result3, result4) || 1;
    normal2.setXYZ(indexValue, result2 / result5, result3 / result5, result4 / result5);
    normal2.setXYZ(result, result2 / result5, result3 / result5, result4 / result5);
  }
}
