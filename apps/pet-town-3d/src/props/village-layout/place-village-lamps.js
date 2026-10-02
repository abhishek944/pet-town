/** Deterministic settlement layout, buildings, connecting footpaths, lamps, props and bridge site selection. */

import { facePropTowardCardinalPoint } from "../terrain-placement/face-prop-toward-cardinal-point.js";
export function placeVillageLamps(village) {
  village.isNearStone = (value34, value35, value36) =>
    village.stones.some(
      (position13) => Math.hypot(position13.x - value34, position13.z - value35) < value36,
    );
  village.isNearEntrance = (value37, value38, value39) =>
    village.entrances.some(
      ([value40, value41]) => Math.hypot(value40 - value37, value41 - value38) < value39,
    );
  village.lamps = [];
  village.addLampSite = (value42, value43) => {
    if (!(
      village.lamps.length >= 8 ||
      !village.terrain.inBounds(value42, value43) ||
      village.terrain.h(value42, value43) < village.waterLevel + 0.3
    )) {
      if (
        village.hasSpace(value42, value43, 0.6) &&
        !village.isNearStone(value42, value43, 0.9) &&
        !village.isNearEntrance(value42, value43, 2.2) &&
        village.isFlat(value42, value43, 0.4)
      ) {
        if (
          !village.lamps.some(
            (position14) => Math.hypot(position14.x - value42, position14.z - value43) < 4.5,
          )
        ) {
          village.lamps.push({
            x: value42,
            z: value43,
          });
          village.occupied.push({
            x: value42,
            z: value43,
            r: 0.4,
            type: `lamp`,
          });
        }
      }
    }
  };
  village.pathLinks.forEach(([[value44, value45], [value46, value47]], value48) => {
    let result75 = Math.hypot(value46 - value44, value47 - value45) || 1;
    let result76 = -(value47 - value45) / result75;
    let result77 = (value46 - value44) / result75;
    for (let result78 of value48 % 2 ? [1.25, -1.25] : [-1.25, 1.25]) {
      let length2 = village.lamps.length;
      if (
        (village.addLampSite(
          value44 + (value46 - value44) * 0.3 + result76 * result78,
          value45 + (value47 - value45) * 0.3 + result77 * result78,
        ),
        village.lamps.length > length2)
      ) {
        break;
      }
    }
    if (result75 > 9) {
      village.addLampSite(
        value44 + (value46 - value44) * 0.75 - result76 * 1.25,
        value45 + (value47 - value45) * 0.75 - result77 * 1.25,
      );
    }
  });
  for (let index6 = 0; index6 < 10 && village.lamps.length < 8; index6++) {
    let result79 = index6 * 0.8 + 0.4;
    village.addLampSite(
      village.plaza.x + Math.cos(result79) * 4.5,
      village.plaza.z + Math.sin(result79) * 4.5,
    );
  }
  for (let position15 of village.lamps) {
    village.items.push({
      type: `lamp`,
      x: position15.x,
      z: position15.z,
      rot:
        facePropTowardCardinalPoint(position15.x, position15.z, village.plaza.x, village.plaza.z) +
        Math.PI,
      r: 0.35,
      y: village.terrain.h(position15.x, position15.z),
    });
  }
}
