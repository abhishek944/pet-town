export function playerWorldRaycast(x, y, z, dx, dy, dz, maxDistance, forCamera = false) {
  let result = Math.floor(x);
  let result2 = Math.floor(y);
  let result3 = Math.floor(z);
  let result4 = dx > 0 ? 1 : -1;
  let result5 = dy > 0 ? 1 : -1;
  let result6 = dz > 0 ? 1 : -1;
  let result7 = Math.abs(1 / (dx || 1e-9));
  let result8 = Math.abs(1 / (dy || 1e-9));
  let result9 = Math.abs(1 / (dz || 1e-9));
  let result10 = (dx > 0 ? result + 1 - x : x - result) * result7;
  let result11 = (dy > 0 ? result2 + 1 - y : y - result2) * result8;
  let result12 = (dz > 0 ? result3 + 1 - z : z - result3) * result9;
  let index = 0;
  for (let index2 = 0; index2 < 256 && index <= maxDistance; index2++) {
    if (
      index2 > 0 &&
      (forCamera ? this.solidCam(result, result2, result3) : this.solid(result, result2, result3))
    ) {
      return index;
    }
    if (result10 < result11 && result10 < result12) {
      result += result4;
      index = result10;
      result10 += result7;
    } else {
      if (result11 < result12) {
        result2 += result5;
        index = result11;
        result11 += result8;
      } else {
        result3 += result6;
        index = result12;
        result12 += result9;
      }
    }
  }
  return maxDistance;
}
