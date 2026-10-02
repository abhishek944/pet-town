/** Prop lifecycle, collision and interaction API, terrain reseating, static batches and animated prop effects. */

import { appendPathStoneGeometry } from "../stonework/append-path-stone-geometry.js";
export function buildVillagePathStones(build) {
  build.layout.stones.forEach((position12, value21) => {
    let result20 = build.terrain.h(position12.x, position12.z);
    let callback2Result6 = build.beginRecord(
      `s` + value21,
      {
        type: `stone`,
        x: position12.x,
        z: position12.z,
        y: result20,
      },
      {
        reseat: true,
        kind: `stone`,
      },
    );
    build.builder.begin(position12.x, result20, position12.z, 0, {
      aoH: 0.1,
      aoMin: 1,
    });
    appendPathStoneGeometry(build.builder, build.random);
    callback2Result6.stone = position12;
  });
}
