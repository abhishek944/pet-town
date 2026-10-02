/** Deterministic settlement layout, buildings, connecting footpaths, lamps, props and bridge site selection. */

import { findVillageBridgeSite } from "./find-village-bridge-site.js";
export function placeVillageSeatingAndBridge(village) {
  village.isFlat = (value19, value20, value21, value22 = 0.3) =>
    village.terrain.footprint(value19, value20, value21, value21, 0, Math.max(0.3, value21 / 2))
      .range <= value22;
  if (village.campfire) {
    for (let [result38, result39] of [
      [Math.PI * 0.95, `bench`],
      [Math.PI * 1.55, `bench`],
      [Math.PI * 0.25, `logSeat`],
    ]) {
      for (let result40 of [2.6, 2.9, 2.3]) {
        let result41 = village.campfire.x + Math.cos(result38) * result40;
        let result42 = village.campfire.z + Math.sin(result38) * result40;
        if (!(
          !village.hasSpace(result41, result42, 0.8) ||
          village.terrain.h(result41, result42) < village.waterLevel + 0.3 ||
          !village.isFlat(result41, result42, 0.8)
        )) {
          village.items.push({
            type: result39,
            x: result41,
            z: result42,
            rot: Math.atan2(village.campfire.x - result41, village.campfire.z - result42),
            r: 0.9,
            y: village.terrain.h(result41, result42),
          });
          village.occupied.push({
            x: result41,
            z: result42,
            r: 0.9,
            type: result39,
          });
          break;
        }
      }
    }
  }
  village.bridge = null;
  if (Number.isFinite(village.waterLevel)) {
    village.bridge = findVillageBridgeSite(
      village.terrain,
      village.plaza,
      village.waterLevel,
      village.occupied,
      30,
    );
  }
  if (village.bridge) {
    village.items.push({
      type: `bridge`,
      ...village.bridge,
      r: 0,
    });
    village.occupied.push({
      x: village.bridge.mx,
      z: village.bridge.mz,
      r: village.bridge.L / 2,
      type: `bridge`,
    });
  }
}
