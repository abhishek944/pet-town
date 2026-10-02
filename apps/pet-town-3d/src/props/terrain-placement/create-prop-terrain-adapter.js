/** Terrain footprint sampling, cardinal orientation and cottage/windmill entrance access. */
export function createPropTerrainAdapter(terrainValue) {
  let terrain2 = terrainValue.terrain;
  let result = typeof terrain2?.topY == `function` ? terrain2.topY : terrain2?.heightAt;
  let callback = (value, value2) => {
    try {
      let result4 = result?.call(terrain2, value, value2);
      return Number.isFinite(result4) ? result4 : 0;
    } catch {
      return 0;
    }
  };
  let result2 = Number.isFinite(terrain2?.size) ? terrain2.size : 96;
  let result3 = result2 / 2;
  let callback2 = () => {
    let result5 = terrain2?.waterLevel ?? terrainValue.water?.level;
    return Number.isFinite(result5) ? result5 : -1 / 0;
  };
  return {
    h: callback,
    wl: callback2,
    isWater: (value3, value4) => {
      try {
        if (typeof terrain2?.isWater == `function`) {
          return !!terrain2.isWater(value3, value4);
        }
      } catch {}
      return callback(value3, value4) < callback2();
    },
    footprint: (value5, value6, value7, value8, value9 = 0, value10 = 0.7) => {
      let result6 = Math.cos(value9);
      let result7 = Math.sin(value9);
      let callback2Result = callback2();
      let result8 = 1 / 0;
      let result9 = -1 / 0;
      let index = 0;
      let index2 = 0;
      let index3 = 0;
      let index4 = 0;
      let result10 = Math.max(1, Math.ceil((2 * value7) / value10));
      let result11 = Math.max(1, Math.ceil((2 * value8) / value10));
      for (let index5 = 0; index5 <= result10; index5++) {
        for (let index6 = 0; index6 <= result11; index6++) {
          let result13 = -value7 + (2 * value7 * index5) / result10;
          let result14 = -value8 + (2 * value8 * index6) / result11;
          let callbackResult = callback(
            value5 + result13 * result6 + result14 * result7,
            value6 - result13 * result7 + result14 * result6,
          );
          result8 = Math.min(result8, callbackResult);
          result9 = Math.max(result9, callbackResult);
          index += callbackResult;
          index2 += callbackResult * callbackResult;
          index3++;
          if (callbackResult < callback2Result + 0.35) {
            index4++;
          }
        }
      }
      let result12 = index / index3;
      return {
        min: result8,
        max: result9,
        mean: result12,
        std: Math.sqrt(Math.max(0, index2 / index3 - result12 * result12)),
        wet: index4 / index3,
        range: result9 - result8,
      };
    },
    slope: (value11, value12) => {
      if (typeof terrain2?.slopeAt == `function`) {
        try {
          let slopeAtResult = terrain2.slopeAt(value11, value12);
          if (Number.isFinite(slopeAtResult)) {
            return slopeAtResult;
          }
        } catch {}
      }
      return (
        Math.hypot(
          callback(value11 + 0.75, value12) - callback(value11 - 0.75, value12),
          callback(value11, value12 + 0.75) - callback(value11, value12 - 0.75),
        ) / 1.5
      );
    },
    size: result2,
    half: result3,
    inBounds: (value13, value14, value15 = 3) =>
      Math.abs(value13) < result3 - value15 && Math.abs(value14) < result3 - value15,
  };
}
