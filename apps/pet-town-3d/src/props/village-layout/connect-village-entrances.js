/** Deterministic settlement layout, buildings, connecting footpaths, lamps, props and bridge site selection. */

import { transformPropGroundPoint } from "../terrain-placement/transform-prop-ground-point.js";
export function connectVillageEntrances(village) {
  village.pathLinks = [];
  village.nearestPlazaEdge = (value23, value24, value25 = 3.2) => {
    let result43 = Math.hypot(value23 - village.plaza.x, value24 - village.plaza.z) || 1;
    return [
      village.plaza.x + ((value23 - village.plaza.x) / result43) * value25,
      village.plaza.z + ((value24 - village.plaza.z) / result43) * value25,
    ];
  };
  village.isPath = (value26, value27) => {
    try {
      return village.context.terrain?.biomeAt?.(value26, value27) === `path`;
    } catch {
      return false;
    }
  };
  village.nearestPath = (value28, value29) => {
    let result44 = null;
    let result45 = 25;
    for (let result46 = -24; result46 <= 24; result46++) {
      for (let result47 = -24; result47 <= 24; result47++) {
        let hypotResult3 = Math.hypot(result47, result46);
        if (hypotResult3 >= result45) {
          continue;
        }
        let result48 = Math.floor(value28 + result47) + 0.5;
        let result49 = Math.floor(value29 + result46) + 0.5;
        if (
          village.isPath(result48, result49) &&
          village.terrain.h(result48, result49) > village.waterLevel + 0.2
        ) {
          result45 = hypotResult3;
          result44 = [result48, result49];
        }
      }
    }
    return result44 ?? village.nearestPlazaEdge(value28, value29);
  };
  for (let result50 of [village.mainCottage, village.cabin, village.windmill]) {
    if (result50?.front) {
      village.pathLinks.push([
        result50.front,
        village.nearestPath(result50.front[0], result50.front[1]),
      ]);
    }
  }
  if (village.stall) {
    let transformPropGroundPointResult5 = transformPropGroundPoint(village.stall, 0, 2.3);
    village.pathLinks.push([
      transformPropGroundPointResult5,
      village.nearestPath(transformPropGroundPointResult5[0], transformPropGroundPointResult5[1]),
    ]);
  }
  if (village.garden) {
    let transformPropGroundPointResult6 = transformPropGroundPoint(village.garden, 0, 3.4);
    village.pathLinks.push([
      transformPropGroundPointResult6,
      village.nearestPath(transformPropGroundPointResult6[0], transformPropGroundPointResult6[1]),
    ]);
  }
  if (village.bridge) {
    let result51 =
      Math.hypot(village.bridge.ax - village.plaza.x, village.bridge.az - village.plaza.z) <
      Math.hypot(village.bridge.bx - village.plaza.x, village.bridge.bz - village.plaza.z)
        ? [village.bridge.ax - village.bridge.dx * 0.9, village.bridge.az - village.bridge.dz * 0.9]
        : [
            village.bridge.bx + village.bridge.dx * 0.9,
            village.bridge.bz + village.bridge.dz * 0.9,
          ];
    village.entrances.push(result51);
    if (Math.hypot(result51[0] - village.plaza.x, result51[1] - village.plaza.z) < 34) {
      village.pathLinks.push([result51, village.nearestPath(result51[0], result51[1])]);
    }
  }
}
