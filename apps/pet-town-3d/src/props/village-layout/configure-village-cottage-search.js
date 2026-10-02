/** Deterministic settlement layout, buildings, connecting footpaths, lamps, props and bridge site selection. */

import { propsState } from "../state.js";
import { getCottagePlacementAccess } from "../terrain-placement/get-cottage-placement-access.js";
import { transformPropGroundPoint } from "../terrain-placement/transform-prop-ground-point.js";
export function configureVillageCottageSearch(village) {
  village.placeCottage = (value12, value13, value14, value15) => {
    let result25 = propsState.cottageVariants[value12];
    let callback3Result4 = village.placeBuilding(`cottage`, value13, value14, {
      hw: result25.W / 2 + 1.4,
      hd: result25.D / 2 + 2.2,
      r: Math.hypot(result25.W, result25.D) / 2 + 1.6,
      searchR: value15,
      variant: value12,
    });
    if (!callback3Result4) {
      return null;
    }
    let callback14 = (value16, value17, value18) => {
      let result28 = 1 / 0;
      for (let result29 = -value18; result29 <= value18; result29 += 0.5) {
        for (let result30 = -value18; result30 <= value18; result30 += 0.5) {
          let hypotResult2 = Math.hypot(result30, result29);
          if (
            hypotResult2 < result28 &&
            village.isExistingPath(value16 + result30, value17 + result29)
          ) {
            result28 = hypotResult2;
          }
        }
      }
      return result28;
    };
    let result26 = propsState.cottageVariants[value12];
    let rot2 = callback3Result4.rot;
    let stats2 = callback3Result4.stats;
    let rot2Value = rot2;
    let result27 = 1 / 0;
    for (let result31 of [0, 1, -1, 2]) {
      let result32 = rot2 + (result31 * Math.PI) / 2;
      let options2 = {
        ...callback3Result4,
        rot: result32,
      };
      let footprintResult3 = village.terrain.footprint(
        callback3Result4.x,
        callback3Result4.z,
        callback3Result4.opts.hw,
        callback3Result4.opts.hd,
        result32,
        0.7,
      );
      if (footprintResult3.range > stats2.range + 0.5 || footprintResult3.wet > 0.02) {
        continue;
      }
      let cottagePlacementAccessResult2 = getCottagePlacementAccess(village.terrain, options2);
      let [transformPropGroundPointResult, transformPropGroundPointResult2] =
        transformPropGroundPoint(options2, 0, -result26.D / 2 - 0.6);
      let callback14Result = callback14(
        cottagePlacementAccessResult2.front[0],
        cottagePlacementAccessResult2.front[1],
        3,
      );
      let callback14Result2 = callback14(
        transformPropGroundPointResult,
        transformPropGroundPointResult2,
        1.5,
      );
      let result33 =
        (callback14Result <= 2 ? callback14Result : 6) +
        (callback14Result2 <= 1 ? 4 : 0) +
        (result31 === 0 ? 0 : 0.8) +
        Math.abs(footprintResult3.max - callback3Result4.y) * 0.5;
      if (result33 < result27) {
        result27 = result33;
        rot2Value = result32;
      }
    }
    if (rot2Value !== rot2) {
      callback3Result4.rot = rot2Value;
      let footprintResult4 = village.terrain.footprint(
        callback3Result4.x,
        callback3Result4.z,
        callback3Result4.opts.hw,
        callback3Result4.opts.hd,
        rot2Value,
        0.7,
      );
      callback3Result4.y = footprintResult4.max;
      callback3Result4.found = Math.max(0.3, callback3Result4.y - footprintResult4.min + 0.35);
      callback3Result4.stats = footprintResult4;
    }
    {
      let [transformPropGroundPointResult3, transformPropGroundPointResult4] =
        transformPropGroundPoint(callback3Result4, 0, -result26.D / 2 - 0.6);
      if (
        callback14(transformPropGroundPointResult3, transformPropGroundPointResult4, 1.5) <= 1.2
      ) {
        callback3Result4.opts.backDoor = true;
      }
    }
    let cottagePlacementAccessResult = getCottagePlacementAccess(village.terrain, callback3Result4);
    Object.assign(callback3Result4, {
      frontGround: cottagePlacementAccessResult.frontGround,
      front: cottagePlacementAccessResult.front,
    });
    village.occupied.push({
      x: cottagePlacementAccessResult.porch[0],
      z: cottagePlacementAccessResult.porch[1],
      r: cottagePlacementAccessResult.porchR,
      type: `porch`,
    });
    village.entrances.push(cottagePlacementAccessResult.front);
    return callback3Result4;
  };
}
