/** Deterministic settlement layout, buildings, connecting footpaths, lamps, props and bridge site selection. */
export function configureVillageDecorationSearch(village) {
  village.placeDecoration = (
    value49,
    value50,
    value51,
    value52,
    value53,
    value54 = {},
    value55 = null,
    value56 = 0.3,
  ) => {
    if (
      !village.terrain.inBounds(value50, value51) ||
      village.terrain.h(value50, value51) < village.waterLevel + 0.25 ||
      !village.hasSpace(value50, value51, value53, 0, value55) ||
      village.isNearStone(value50, value51, value53 + 0.2) ||
      !village.isFlat(value50, value51, Math.min(value53, 1.2), value56)
    ) {
      return null;
    }
    let options3 = {
      type: value49,
      x: value50,
      z: value51,
      rot: value52,
      r: value53,
      y: village.terrain.h(value50, value51),
      opts: value54,
    };
    village.occupied.push({
      x: value50,
      z: value51,
      r: value53,
      type: value49,
    });
    village.items.push(options3);
    return options3;
  };
}
