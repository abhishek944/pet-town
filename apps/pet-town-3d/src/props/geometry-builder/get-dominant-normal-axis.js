/** UV generation, transform composition, vertex color baking and material-batched geometry builder. */
export function getDominantNormalAxis(getXValue, value) {
  let result = Math.abs(getXValue.getX(value));
  let result2 = Math.abs(getXValue.getY(value));
  let result3 = Math.abs(getXValue.getZ(value));
  return result >= result2 && result >= result3 ? 0 : result2 >= result3 ? 1 : 2;
}
