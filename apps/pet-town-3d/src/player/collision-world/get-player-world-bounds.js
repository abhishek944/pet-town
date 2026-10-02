export function getPlayerWorldBounds() {
  let t2 = this.t;
  let bounds2 = t2?.bounds;
  if (bounds2 && typeof bounds2.minX == `number`) {
    return bounds2;
  }
  let result = typeof t2?.size == `number` ? t2.size : typeof t2?.SIZE == `number` ? t2.SIZE : 0;
  return result > 0
    ? {
        minX: -result / 2,
        maxX: result / 2,
        minZ: -result / 2,
        maxZ: result / 2,
      }
    : {
        minX: -1e4,
        maxX: 1e4,
        minZ: -1e4,
        maxZ: 1e4,
      };
}
