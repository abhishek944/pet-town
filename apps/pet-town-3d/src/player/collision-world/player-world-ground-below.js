export function playerWorldGroundBelow(x, y, z, maxDepth = 40, forCamera = false) {
  let result = Math.floor(x);
  let result2 = Math.floor(z);
  let result3 = Math.floor(y - 1e-4);
  let result4 = result3 - maxDepth;
  for (; result3 >= result4; result3--) {
    if (
      forCamera ? this.solidCam(result, result3, result2) : this.solid(result, result3, result2)
    ) {
      return result3 + 1;
    }
  }
  return -1 / 0;
}
