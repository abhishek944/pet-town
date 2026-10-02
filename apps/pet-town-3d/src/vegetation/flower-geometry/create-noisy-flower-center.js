/** Cupped petals, flower rings, bent stems and flower variants with levels of detail. */
import { createFoliageEllipsoid } from "../geometry-helpers/create-foliage-ellipsoid.js";
import { vegetationValueNoise3d } from "../random/vegetation-value-noise3d.js";
export function createNoisyFlowerCenter(value, value2 = 0.55, value3 = 1, value4 = 8, value5 = 5) {
  let foliageEllipsoidResult = createFoliageEllipsoid(value, value4, value5, value2);
  let position2 = foliageEllipsoidResult.attributes.position;
  for (let index = 0; index < position2.count; index++) {
    let xResult = position2.getX(index);
    let yResult = position2.getY(index);
    let zResult = position2.getZ(index);
    let result =
      1 +
      (vegetationValueNoise3d(
        (xResult / value) * 2.5,
        (yResult / value) * 2.5,
        (zResult / value) * 2.5,
        value3,
      ) -
        0.5) *
        0.25;
    position2.setXYZ(index, xResult * result, yResult * result, zResult * result);
  }
  return foliageEllipsoidResult;
}
