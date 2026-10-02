export function getPlayerWorldWaterLevel() {
  let t2 = this.t;
  let water2 = this.ctx.water;
  let callback = (value) => (typeof value == `number` && isFinite(value) ? value : undefined);
  return (
    callback(water2?.surfaceY) ??
    callback(t2?.waterLevel) ??
    callback(water2?.level) ??
    callback(water2?.waterLevel) ??
    callback(this.ctx.waterLevel) ??
    -1 / 0
  );
}
