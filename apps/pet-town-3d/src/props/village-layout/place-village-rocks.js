/** Deterministic settlement layout, buildings, connecting footpaths, lamps, props and bridge site selection. */
export function placeVillageRocks(village) {
  for (let index7 = 0, index8 = 0; index7 < 60 && index8 < 6; index7++) {
    let result105 = village.random.next() * Math.PI * 2;
    let rangeResult = village.random.range(12, 22);
    let result106 = village.plaza.x + Math.cos(result105) * rangeResult;
    let result107 = village.plaza.z + Math.sin(result105) * rangeResult;
    let rangeResult2 = village.random.range(0.7, 1.4);
    if (!(
      village.isNearEntrance(result106, result107, 3) ||
      village.terrain.slope(result106, result107) > 0.45 ||
      village.terrain.footprint(
        result106,
        result107,
        rangeResult2 * 2.2 + 0.6,
        rangeResult2 * 2.2 + 0.6,
        0,
        0.6,
      ).range > 0.3
    )) {
      if (
        village.placeDecoration(
          `rocks`,
          result106,
          result107,
          village.random.next() * 6,
          rangeResult2 * 2.1,
          {
            r: rangeResult2,
          },
          null,
          0.3,
        )
      ) {
        index8++;
      }
    }
  }
}
