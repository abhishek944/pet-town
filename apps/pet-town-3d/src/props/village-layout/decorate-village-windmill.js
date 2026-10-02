/** Deterministic settlement layout, buildings, connecting footpaths, lamps, props and bridge site selection. */

import { transformPropGroundPoint } from "../terrain-placement/transform-prop-ground-point.js";
export function decorateVillageWindmill(village) {
  if (village.windmill) {
    let callback16 = (value59, value60, value61, value62) => {
      let [transformPropGroundPointResult9, transformPropGroundPointResult10] =
        transformPropGroundPoint(village.windmill, value59, value60);
      return Math.abs(
        village.terrain.h(transformPropGroundPointResult9, transformPropGroundPointResult10) -
          village.windmill.y,
      ) > 0.3
        ? null
        : village.placeDecoration(
            value61,
            transformPropGroundPointResult9,
            transformPropGroundPointResult10,
            village.windmill.rot + village.random.range(-0.5, 0.5),
            value62,
            {},
            `windmill`,
          );
    };
    for (let [result93, result94] of [
      [2.3, 2],
      [2.6, 0.6],
      [-2.6, -0.8],
      [2.2, -1.8],
    ]) {
      if (callback16(result93, result94, `sackPile`, 0.7)) {
        break;
      }
    }
    for (let [result95, result96] of [
      [-2.4, 1.8],
      [-2.7, 0.4],
      [2.5, -0.9],
    ]) {
      if (callback16(result95, result96, `crateStack`, 0.6)) {
        break;
      }
    }
    for (let [result97, result98] of [
      [-2.9, 0.6],
      [2.9, 0.9],
      [-2.2, -2],
    ]) {
      if (callback16(result97, result98, `barrel`, 0.45)) {
        break;
      }
    }
    for (let [result99, result100] of [
      [3.4, 3.4],
      [-3.4, 3.4],
      [3.6, 0],
      [-3.6, 0],
    ]) {
      let [transformPropGroundPointResult11, transformPropGroundPointResult12] =
        transformPropGroundPoint(village.windmill, result99, result100);
      if (
        Math.abs(
          village.terrain.h(transformPropGroundPointResult11, transformPropGroundPointResult12) -
            village.windmill.y,
        ) <= 0.3 &&
        village.placeDecoration(
          `bench`,
          transformPropGroundPointResult11,
          transformPropGroundPointResult12,
          village.windmill.rot,
          0.9,
          {},
          `windmill`,
        )
      ) {
        break;
      }
    }
  }
}
