/** Prop lifecycle, collision and interaction API, terrain reseating, static batches and animated prop effects. */

import { propsState } from "../state.js";
import { propsClearVegetationAroundProps } from "./props-clear-vegetation-around-props.js";
export function clearVegetationForVillage(build) {
  propsState.propVegetationClearings.length = 0;
  build.treeClearingRadii = {
    cottage: 3.2,
    windmill: 5.5,
    stall: 2.2,
    garden: 2.2,
    campfire: 2.5,
    bridge: 0,
  };
  build.groundClearingRadii = {
    campfire: 3,
    bench: 1.1,
    logSeat: 1,
    stall: 3.8,
    washingLine: 2,
  };
  for (let position13 of propsState.propEntries) {
    propsState.propVegetationClearings.push({
      x: position13.x,
      z: position13.z,
      radius: (position13.radius ?? 1) + (build.treeClearingRadii[position13.type] ?? 1.2),
      small: build.groundClearingRadii[position13.type] ?? (position13.radius ?? 1) + 0.2,
    });
  }
  propsState.propVegetationClearings.push({
    x: build.layout.P.x,
    z: build.layout.P.z,
    radius: 6.5,
    small: 3.2,
  });
  for (let position14 of build.layout.stones) {
    propsState.propVegetationClearings.push({
      x: position14.x,
      z: position14.z,
      radius: 1.6,
      small: 0.45,
    });
  }
  for (let result21 of build.clearings) {
    propsState.propVegetationClearings.push(result21);
  }
  propsClearVegetationAroundProps();
}
