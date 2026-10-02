export function playerWorldCanopySpan(x, y, z, dx, dy, dz, maxDistance) {
  let canopies2 = this.ctx.vegetation?.canopies;
  if (!Array.isArray(canopies2)) {
    return null;
  }
  let result = x + dx * maxDistance;
  let result2 = y + dy * maxDistance;
  let result3 = z + dz * maxDistance;
  for (let position of canopies2) {
    if (!position) {
      continue;
    }
    let result4 = position.r + 0.35;
    let result5 = result - position.x;
    let result6 = result2 - position.y;
    let result7 = result3 - position.z;
    if (result5 * result5 + result6 * result6 + result7 * result7 > result4 * result4) {
      continue;
    }
    let result8 = x - position.x;
    let result9 = y - position.y;
    let result10 = z - position.z;
    let result11 = result8 * dx + result9 * dy + result10 * dz;
    let result12 = result8 * result8 + result9 * result9 + result10 * result10 - result4 * result4;
    let result13 = result11 * result11 - result12;
    if (result13 < 0) {
      continue;
    }
    let result14 = Math.sqrt(result13);
    return [-result11 - result14, -result11 + result14];
  }
  return null;
}
