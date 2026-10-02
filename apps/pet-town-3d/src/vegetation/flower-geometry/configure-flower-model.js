/** Cupped petals, flower rings, bent stems and flower variants with levels of detail. */

import { foliageColorToRgb } from "../geometry-helpers/foliage-color-to-rgb.js";
import { vegetationState } from "../state.js";
import { createFoliageDetailRandom } from "../undergrowth-geometry/create-foliage-detail-random.js";
export function configureFlowerModel(flower) {
  flower.lod = flower.settings.lod ?? 0;
  flower.parts = [];
  flower.stemDark = foliageColorToRgb(`#2f6f2c`);
  flower.stemLight = foliageColorToRgb(`#5aa43a`);
  flower.height =
    {
      lavender: 0.46,
      tulip: 0.34,
      puff: 0.36,
      daisy: 0.27,
      round: 0.29,
    }[flower.kind] *
    (flower.settings.hScale ?? 1) *
    (0.85 + flower.random() * 0.3);
  flower.leanX = (flower.random() - 0.5) * 0.1;
  flower.leanZ = (flower.random() - 0.5) * 0.1;
  flower.tiltX = (flower.random() - 0.5) * 0.45;
  flower.tiltZ = (flower.random() - 0.5) * 0.45;
  flower.rotationY = flower.random() * vegetationState.foliageFullTurn;
  flower.leafAngles = [
    flower.random() * vegetationState.foliageFullTurn,
    flower.random() * vegetationState.foliageFullTurn,
  ];
  flower.leafLeans = [1.1 + flower.random() * 0.5, 1.1 + flower.random() * 0.5];
  flower.detailRandom = createFoliageDetailRandom(Math.floor(flower.random() * 1e9));
  flower.headX = flower.leanX;
  flower.headZ = flower.leanZ;
  flower.headY = flower.height;
  flower.headSway = flower.headY;
}
