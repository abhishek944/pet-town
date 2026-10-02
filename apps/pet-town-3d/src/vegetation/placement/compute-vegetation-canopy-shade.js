/** Vegetation clearings, flower palettes and biome-aware world population. */

import { vegetationState } from "../state.js";
export function computeVegetationCanopyShade(world) {
  world.canopyShade = new Float32Array(world.cellCount);
  for (let position3 of vegetationState.vegetationRuntimeState.trees) {
    if (position3.type === `palm`) {
      continue;
    }
    let result51 = position3.canopyRadius * 0.95;
    let ceilResult = Math.ceil(result51);
    for (let result52 = -ceilResult; result52 <= ceilResult; result52++) {
      for (let result53 = -ceilResult; result53 <= ceilResult; result53++) {
        let cellOfResult2 = world.ground.cellOf(position3.x + result53, position3.z + result52);
        if (cellOfResult2 < 0) {
          continue;
        }
        let result54 =
          Math.hypot(
            world.cellX(cellOfResult2) - position3.x,
            world.cellZ(cellOfResult2) - position3.z,
          ) / result51;
        if (!(result54 >= 1)) {
          world.canopyShade[cellOfResult2] = Math.max(
            world.canopyShade[cellOfResult2],
            1 - result54 * result54,
          );
        }
      }
    }
  }
}
