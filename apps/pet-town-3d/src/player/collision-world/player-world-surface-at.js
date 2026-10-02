export function playerWorldSurfaceAt(x, z) {
  let _rawTopResult = this._rawTop(x, z);
  let result = Math.max(
    (_rawTopResult ?? 0) + 4,
    (this.t?.maxHeight ?? this.t?.height ?? this.t?.MAXH ?? 0) + 4,
    40,
  );
  let groundBelowResult = this.groundBelow(x, result, z, result - this.floorY + 2);
  return isFinite(groundBelowResult) ? groundBelowResult : (_rawTopResult ?? 0);
}
