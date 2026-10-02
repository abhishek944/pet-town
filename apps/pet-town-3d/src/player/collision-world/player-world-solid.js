export function playerWorldSolid(x, y, z) {
  let bounds2 = this.bounds;
  if (
    x < bounds2.minX ||
    x >= bounds2.maxX ||
    z < bounds2.minZ ||
    z >= bounds2.maxZ ||
    y < this.floorY
  ) {
    return true;
  }
  let t2 = this.t;
  if (!t2) {
    return false;
  }
  let result = t2.isSolid ?? t2.solidAt;
  if (typeof result == `function`) {
    try {
      return !!result.call(t2, x, y, z);
    } catch {}
  }
  if (this.live) {
    return this.solidValue(this.block(x, y, z));
  }
  let _rawTopResult = this._rawTop(x + 0.5, z + 0.5);
  return _rawTopResult != null && y < Math.round(_rawTopResult);
}
