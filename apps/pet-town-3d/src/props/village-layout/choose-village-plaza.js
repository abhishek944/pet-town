/** Deterministic settlement layout, buildings, connecting footpaths, lamps, props and bridge site selection. */
import { PropRandom } from "../math/prop-random.js";
export function chooseVillagePlaza(village) {
  village.random = new PropRandom(village.seed);
  village.isExistingPath = (value2, value3) => {
    try {
      return village.context.terrain?.biomeAt?.(value2, value3) === `path`;
    } catch {
      return false;
    }
  };
  village.waterLevel = village.terrain.wl();
  village.occupied = [];
  village.spawn = village.context.terrain?.spawn;
  if (Number.isFinite(village.spawn?.x) && Number.isFinite(village.spawn?.z)) {
    village.occupied.push({
      x: village.spawn.x,
      z: village.spawn.z,
      r: 2.2,
      type: `spawn`,
    });
  }
  village.hasSpace = (value4, value5, value6, value7 = 0, value8 = null) =>
    village.occupied.every(
      (position3) =>
        (value8 && position3.type === value8) ||
        Math.hypot(position3.x - value4, position3.z - value5) > position3.r + value6 - value7,
    );
  village.entrances = [];
  village.plaza = null;
  village.bestPlazaScore = 1 / 0;
  for (let index = 0; index <= 28; index += 2) {
    let result7 = index === 0 ? 1 : Math.round((2 * Math.PI * index) / 3);
    for (let index2 = 0; index2 < result7; index2++) {
      let result8 = (index2 / result7) * Math.PI * 2;
      let result9 = Math.round(Math.cos(result8) * index);
      let result10 = Math.round(Math.sin(result8) * index);
      if (!village.terrain.inBounds(result9, result10, 16)) {
        continue;
      }
      let footprintResult = village.terrain.footprint(result9, result10, 9, 9, 0, 1.5);
      let result11 =
        footprintResult.std * 3 +
        footprintResult.range * 0.4 +
        footprintResult.wet * 30 +
        index * 0.07;
      if (result11 < village.bestPlazaScore) {
        village.bestPlazaScore = result11;
        village.plaza = {
          x: result9,
          z: result10,
        };
      }
    }
  }
  village.plaza ||= {
    x: 0,
    z: 0,
  };
  village.plaza.y = village.terrain.h(village.plaza.x, village.plaza.z);
  village.items = [];
}
