/** Deterministic settlement layout, buildings, connecting footpaths, lamps, props and bridge site selection. */
export function sampleVillageFootpaths(village) {
  village.stones = [];
  village.stairs = [];
  village.isPathBlocked = (value30, value31) =>
    village.occupied.some(
      (position7) =>
        position7.type !== `garden` &&
        position7.type !== `spawn` &&
        Math.hypot(position7.x - value30, position7.z - value31) <
          position7.r - (position7.type === `porch` ? 0.3 : 0.6),
    );
  village.pathSamples = [];
  for (let [[result52, result53], [result54, result55]] of village.pathLinks) {
    let hypotResult4 = Math.hypot(result54 - result52, result55 - result53);
    if (hypotResult4 < 0.5) {
      continue;
    }
    let result56 = -(result55 - result53) / hypotResult4;
    let result57 = (result54 - result52) / hypotResult4;
    let result58 = village.random.range(-0.12, 0.12) * hypotResult4;
    let result59 = (result52 + result54) / 2 + result56 * result58;
    let result60 = (result53 + result55) / 2 + result57 * result58;
    let result61 = Math.max(2, Math.round(hypotResult4 / 0.85));
    let values9 = [];
    let callback15 = (value32) => {
      let result62 = (1 - value32) * (1 - value32);
      let result63 = 2 * value32 * (1 - value32);
      let result64 = value32 * value32;
      return [
        result62 * result52 + result63 * result59 + result64 * result54,
        result62 * result53 + result63 * result60 + result64 * result55,
      ];
    };
    for (let index3 = 0; index3 <= result61; index3++) {
      let [callback15Result, callback15Result2] = callback15(index3 / result61);
      let result65 = (index3 % 2 ? 1 : -1) * village.random.range(0.06, 0.16);
      if (
        ((callback15Result += result56 * result65),
        (callback15Result2 += result57 * result65),
        village.isPath(callback15Result, callback15Result2))
      ) {
        break;
      }
      if (!(
        village.terrain.h(callback15Result, callback15Result2) < village.waterLevel + 0.2 ||
        village.isPathBlocked(callback15Result, callback15Result2)
      )) {
        values9.push({
          x: callback15Result,
          z: callback15Result2,
          t: index3 / result61,
        });
      }
    }
    for (let result66 = 1; result66 < values9.length; result66++) {
      let position8 = values9[result66 - 1];
      let position9 = values9[result66];
      let result67 = village.terrain.h(position8.x, position8.z);
      let result68 = village.terrain.h(position9.x, position9.z);
      if (Math.abs(result68 - result67) < 0.8 || Math.abs(result68 - result67) > 2.2) {
        continue;
      }
      let position10 = result67 < result68 ? position8 : position9;
      let position11 = result67 < result68 ? position9 : position8;
      let result69 = Math.hypot(position11.x - position10.x, position11.z - position10.z) || 1;
      let result70 = (position11.x - position10.x) / result69;
      let result71 = (position11.z - position10.z) / result69;
      let x2 = position10.x;
      let z2 = position10.z;
      for (let index4 = 0; index4 < 20; index4++) {
        let result72 = position10.x + result70 * index4 * 0.1;
        let result73 = position10.z + result71 * index4 * 0.1;
        if (
          village.terrain.h(result72, result73) >
          village.terrain.h(position10.x, position10.z) + 0.5
        ) {
          break;
        }
        x2 = result72;
        z2 = result73;
      }
      village.stairs.push({
        x: x2 - result70 * 0.35,
        z: z2 - result71 * 0.35,
        rot: Math.atan2(result70, result71),
        rise: Math.abs(result68 - result67),
        y: Math.min(result67, result68),
      });
      position10.skip = position11.skip = true;
    }
    village.pathSamples.push(values9.filter((skipValue) => !skipValue.skip));
  }
}
