/** Vegetation clearings, flower palettes and biome-aware world population. */

import { vegetationState } from "../state.js";
export function placeVegetationLogs(world) {
  world.logBudget = Math.round(9 * world.areaScale);
  world.logCount = 0;
  for (let index17 = 0; index17 < 400 && world.logCount < world.logBudget; index17++) {
    let result55 = Math.floor(world.random() * world.cellCount);
    if (
      !world.isLand(result55) ||
      world.ground.biome[result55] !== vegetationState.vegetationBiomeIds.FOREST ||
      world.occupied[result55] ||
      !world.isSoil(result55) ||
      world.isNearSpawn(world.cellX(result55), world.cellZ(result55), 6)
    ) {
      continue;
    }
    let result56 = Math.floor(
      world.random() * vegetationState.vegetationRuntimeState.lib.log.length,
    );
    let values10 = vegetationState.vegetationRuntimeState.lib.log[result56];
    let result57 = world.random() * Math.PI;
    let result58 = Math.cos(result57);
    let result59 = Math.sin(result57);
    let callback2Result3 = world.cellX(result55);
    let callback3Result3 = world.cellZ(result55);
    let result60 = world.ground.h[result55];
    let result61 = !world.isCleared(callback2Result3, callback3Result3, `tree`, {
      radius: values10.length * 0.5,
      canopyRadius: 0,
    });
    for (let result63 = -0.5; result63 <= 0.5 && result61; result63 += 0.125) {
      let result64 = callback2Result3 + result58 * values10.length * result63;
      let result65 = callback3Result3 - result59 * values10.length * result63;
      let cellOfResult3 = world.ground.cellOf(result64, result65);
      if (
        cellOfResult3 < 0 ||
        !world.isLand(cellOfResult3) ||
        !world.isSoil(cellOfResult3) ||
        Math.abs(world.ground.h[cellOfResult3] - result60) > 0.01 ||
        world.occupied[cellOfResult3] & 7 ||
        world.isNearTree(result64, result65, 0.6)
      ) {
        result61 = false;
      }
      for (let result66 of [-1, 1]) {
        let cellOfResult4 = world.ground.cellOf(
          result64 - result59 * result66 * values10.radius,
          result65 - result58 * result66 * values10.radius,
        );
        if (cellOfResult4 < 0 || Math.abs(world.ground.h[cellOfResult4] - result60) > 0.01) {
          result61 = false;
        }
      }
    }
    if (!result61) {
      continue;
    }
    let result62 = world.fields[`log` + result56].add(
      callback2Result3,
      result60 - 0.04,
      callback3Result3,
      result57,
      1,
      1,
      1,
      null,
    );
    result62.proxyGeos = [values10.geo];
    world.register(result62, callback2Result3, callback3Result3);
    for (let result67 = -0.4; result67 <= 0.41; result67 += 0.2) {
      vegetationState.vegetationRuntimeState.colliders.push({
        x: callback2Result3 + result58 * values10.length * result67,
        y: result60,
        z: callback3Result3 - result59 * values10.length * result67,
        r: values10.radius * 1.05,
        radius: values10.radius * 1.05,
        h: values10.radius * 2,
        kind: `log`,
        item: result62,
      });
    }
    for (let result68 = -0.5; result68 <= 0.5; result68 += 0.125) {
      let cellOfResult5 = world.ground.cellOf(
        callback2Result3 + result58 * values10.length * result68,
        callback3Result3 - result59 * values10.length * result68,
      );
      if (cellOfResult5 >= 0) {
        world.occupied[cellOfResult5] |= 4;
      }
    }
    world.logCount++;
  }
}
