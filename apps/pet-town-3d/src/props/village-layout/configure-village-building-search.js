/** Deterministic settlement layout, buildings, connecting footpaths, lamps, props and bridge site selection. */

import { facePropTowardCardinalPoint } from "../terrain-placement/face-prop-toward-cardinal-point.js";
export function configureVillageBuildingSearch(village) {
  village.placeBuilding = (value9, value10, value11, hwValue = {}) => {
    let result12 = hwValue.hw ?? 1;
    let result13 = hwValue.hd ?? 1;
    let result14 = hwValue.r ?? Math.hypot(result12, result13) * 0.92;
    let result15 = hwValue.searchR ?? 5;
    let result16 = village.plaza.x + value10;
    let result17 = village.plaza.z + value11;
    let position4 = null;
    let result18 = 1 / 0;
    for (let result19 = -result15; result19 <= result15; result19 += hwValue.step ?? 1) {
      for (let result20 = -result15; result20 <= result15; result20 += hwValue.step ?? 1) {
        let hypotResult = Math.hypot(result19, result20);
        if (hypotResult > result15) {
          continue;
        }
        let result21 = result16 + result19;
        let result22 = result17 + result20;
        if (
          !village.terrain.inBounds(result21, result22, result14 + 2) ||
          !village.hasSpace(result21, result22, result14)
        ) {
          continue;
        }
        let result23 =
          hwValue.rot ??
          facePropTowardCardinalPoint(
            result21,
            result22,
            hwValue.faceX ?? village.plaza.x,
            hwValue.faceZ ?? village.plaza.z,
          );
        let footprintResult2 = village.terrain.footprint(
          result21,
          result22,
          result12,
          result13,
          result23,
          0.7,
        );
        if (
          footprintResult2.wet > (hwValue.wetOk ?? 0.02) ||
          (hwValue.maxRange != null && footprintResult2.range > hwValue.maxRange) ||
          (hwValue.check &&
            !hwValue.check({
              x: result21,
              z: result22,
              rot: result23,
              y: footprintResult2.max,
            }))
        ) {
          continue;
        }
        let result24 =
          footprintResult2.range * (hwValue.flatW ?? 1.6) +
          footprintResult2.std * 3 +
          hypotResult * 0.3;
        if (hwValue.preferHigh) {
          result24 -= (footprintResult2.mean - village.plaza.y) * 1.2;
        }
        if (result24 < result18) {
          result18 = result24;
          position4 = {
            x: result21,
            z: result22,
            rot: result23,
            f: footprintResult2,
          };
        }
      }
    }
    if (!position4) {
      return null;
    }
    let position5 = {
      type: value9,
      x: position4.x,
      z: position4.z,
      rot: position4.rot,
      r: result14,
      stats: position4.f,
      opts: hwValue,
    };
    position5.y =
      hwValue.base === `center` ? village.terrain.h(position4.x, position4.z) : position4.f.max;
    position5.found = Math.max(0.3, position5.y - position4.f.min + 0.35);
    village.occupied.push({
      x: position5.x,
      z: position5.z,
      r: result14,
      type: value9,
    });
    village.items.push(position5);
    return position5;
  };
}
