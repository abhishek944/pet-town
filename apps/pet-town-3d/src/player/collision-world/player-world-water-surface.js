export function playerWorldWaterSurface(x, y, z) {
  let water2 = this.ctx.water;
  let waterLevel2 = this.waterLevel;
  let enabled = true;
  if (water2 && typeof water2.isWater == `function`) {
    try {
      enabled = water2.isWater(x, z) !== false;
    } catch {}
  }
  if (enabled && isFinite(waterLevel2) && typeof water2?.sample == `function`) {
    try {
      let Result = water2.sample(x, z);
      if (typeof Result == `number` && isFinite(Result) && Math.abs(Result - waterLevel2) < 1.5) {
        waterLevel2 = Result;
      }
    } catch {}
  }
  if (enabled && isFinite(waterLevel2) && y < waterLevel2 + 0.01) {
    return waterLevel2;
  }
  if (this.live && this.waterIds.size > 1) {
    let result = Math.floor(x);
    let result2 = Math.floor(z);
    let result3 = Math.floor(y);
    if (this.waterIds.has(this.block(result, result3, result2))) {
      for (; this.waterIds.has(this.block(result, result3 + 1, result2)) && result3 < y + 8;) {
        result3++;
      }
      return Math.min(
        result3 + 1,
        isFinite(waterLevel2) && waterLevel2 > result3 ? waterLevel2 : result3 + 1,
      );
    }
  }
  return -1 / 0;
}
