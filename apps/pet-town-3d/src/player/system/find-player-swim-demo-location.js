/** Player spawn, context API, fixed-step orchestration, effects, render interpolation and demo controls. */
export function findPlayerSwimDemoLocation(waterLevelValue, value, value2) {
  let waterLevel2 = waterLevelValue.waterLevel;
  if (!isFinite(waterLevel2)) {
    return null;
  }
  let callback = (value3, value4) => waterLevelValue.surfaceAt(value3, value4) < waterLevel2 - 1.4;
  let result = null;
  let result2 = -1;
  for (let result3 = 1; result3 <= 40 && result2 < 24; result3++) {
    let result4 = result3 * 8;
    for (let index = 0; index < result4; index++) {
      let result5 = (index / result4) * Math.PI * 2;
      let result6 = Math.floor(value + Math.cos(result5) * result3) + 0.5;
      let result7 = Math.floor(value2 + Math.sin(result5) * result3) + 0.5;
      if (!callback(result6, result7)) {
        continue;
      }
      let index2 = 0;
      for (let result8 = -2; result8 <= 2; result8++) {
        for (let result9 = -2; result9 <= 2; result9++) {
          if ((result8 || result9) && callback(result6 + result8, result7 + result9)) {
            index2++;
          }
        }
      }
      if (index2 > result2) {
        result2 = index2;
        result = [result6, result7];
      }
    }
  }
  return result;
}
