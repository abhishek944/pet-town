/** Deterministic settlement layout, buildings, connecting footpaths, lamps, props and bridge site selection. */

import { propsState } from "../state.js";
import { transformPropGroundPoint } from "../terrain-placement/transform-prop-ground-point.js";
export function decorateVillageCabin(village) {
  if (village.cabin) {
    let cabin2 = propsState.cottageVariants.cabin;
    for (let [result101, result102] of [
      [-(cabin2.W / 2 + 2.1), -0.3],
      [cabin2.W / 2 + 2.3, -0.3],
      [0, -cabin2.D / 2 - 2.2],
    ]) {
      let [transformPropGroundPointResult13, transformPropGroundPointResult14] =
        transformPropGroundPoint(village.cabin, result101, result102);
      if (
        village.placeDecoration(
          `washingLine`,
          transformPropGroundPointResult13,
          transformPropGroundPointResult14,
          village.cabin.rot + (result102 < -1 ? 0 : Math.PI / 2),
          1.9,
          {},
          `cottage`,
          0.6,
        )
      ) {
        break;
      }
    }
    for (let [result103, result104] of [
      [cabin2.W / 2 + 0.9, -cabin2.D / 2 - 0.9],
      [-cabin2.W / 2 - 0.9, -cabin2.D / 2 - 0.9],
    ]) {
      let [transformPropGroundPointResult15, transformPropGroundPointResult16] =
        transformPropGroundPoint(village.cabin, result103, result104);
      if (
        village.placeDecoration(
          `crateStack`,
          transformPropGroundPointResult15,
          transformPropGroundPointResult16,
          village.cabin.rot + 0.3,
          0.6,
          {},
          `cottage`,
        )
      ) {
        break;
      }
    }
  }
}
