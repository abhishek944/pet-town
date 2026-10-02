export function playerWorldBoxFree(minX, minY, minZ, maxX, maxY, maxZ) {
  let result = 1e-4;
  for (let result2 = Math.floor(minX + result); result2 <= Math.floor(maxX - result); result2++) {
    for (let result3 = Math.floor(minY + result); result3 <= Math.floor(maxY - result); result3++) {
      for (
        let result4 = Math.floor(minZ + result);
        result4 <= Math.floor(maxZ - result);
        result4++
      ) {
        if (this.solid(result2, result3, result4)) {
          return false;
        }
      }
    }
  }
  return true;
}
