/** Cupped petals, flower rings, bent stems and flower variants with levels of detail. */

import { createBentPlantStem } from "./create-bent-plant-stem.js";
import { buildRoundFlowerHead } from "./build-round-flower-head.js";
import { buildUprightFlowerHead } from "./build-upright-flower-head.js";
export function buildFlowerBloom(flower) {
  if (
    (flower.parts.push(
      flower.lod === 0
        ? createBentPlantStem(
            flower.height,
            flower.leanX,
            flower.leanZ,
            flower.stemDark,
            flower.stemLight,
            flower.kind === `lavender` ? 0.011 : 0.014,
            4,
            2,
          )
        : createBentPlantStem(
            flower.height,
            flower.leanX,
            flower.leanZ,
            flower.stemDark,
            flower.stemLight,
            0.016,
            3,
            1,
          ),
    ),
    flower.kind === `daisy` || flower.kind === `round`)
  ) {
    buildRoundFlowerHead(flower);
  } else {
    buildUprightFlowerHead(flower);
  }
}
