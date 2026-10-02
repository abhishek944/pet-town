/** Player spawn, context API, fixed-step orchestration, effects, render interpolation and demo controls. */
export function findPlayerDrySpawn(waterLevelValue, value, value2) {
  let waterLevel2 = waterLevelValue.waterLevel;
  for (let index = 0; index <= 24; index++) {
    let result = Math.max(1, index * 8);
    for (let index2 = 0; index2 < result; index2++) {
      let result2 = (index2 / result) * Math.PI * 2;
      let result3 = value + Math.cos(result2) * index;
      let result4 = value2 + Math.sin(result2) * index;
      let surfaceAtResult = waterLevelValue.surfaceAt(result3, result4);
      if (!isFinite(waterLevel2) || surfaceAtResult >= waterLevel2 + 0.25) {
        return [Math.floor(result3) + 0.5, Math.floor(result4) + 0.5];
      }
    }
  }
  return [value, value2];
}
