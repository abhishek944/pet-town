/** Cupped petals, flower rings, bent stems and flower variants with levels of detail. */
export function orientFlowerPart(rotateYValue, value, value2, value3, value4, value5, value6) {
  rotateYValue.rotateY(value6);
  rotateYValue.rotateX(value4);
  rotateYValue.rotateZ(value5);
  rotateYValue.translate(value, value2, value3);
  return rotateYValue;
}
