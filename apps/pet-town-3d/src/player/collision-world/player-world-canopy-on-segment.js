export function playerWorldCanopyOnSegment(start, end, padding = 0.4) {
  let vegetation2 = this.ctx.vegetation;
  let canopies2 = vegetation2?.canopies;
  let result = end.x - start.x;
  let result2 = end.y - start.y;
  let result3 = end.z - start.z;
  let result4 = result * result + result2 * result2 + result3 * result3 || 1;
  let callback = (value2, value3, value4, value5) => {
    let result5 = Math.max(
      0,
      Math.min(
        1,
        ((value2 - start.x) * result +
          (value3 - start.y) * result2 +
          (value4 - start.z) * result3) /
          result4,
      ),
    );
    let result6 = start.x + result * result5 - value2;
    let result7 = start.y + result2 * result5 - value3;
    let result8 = start.z + result3 * result5 - value4;
    return (
      result6 * result6 + result7 * result7 + result8 * result8 <
      (value5 + padding) * (value5 + padding)
    );
  };
  if (Array.isArray(canopies2)) {
    for (let position3 of canopies2) {
      if (position3 && callback(position3.x, position3.y, position3.z, position3.r)) {
        return true;
      }
    }
    return false;
  }
  for (let position4 of vegetation2?.trees ?? []) {
    if (!position4) {
      continue;
    }
    let result9 = position4.height ?? 5.5;
    let result10 = (position4.canopyRadius ?? 2.4) * 0.85;
    if (callback(position4.x, (position4.y ?? 0) + result9 - result10, position4.z, result10)) {
      return true;
    }
  }
  return false;
}
