/** Cupped petals, flower rings, bent stems and flower variants with levels of detail. */
import { createCuppedPetalGeometry } from "./create-cupped-petal-geometry.js";
import { vegetationState } from "../state.js";
export function createRadialPetalRing(
  value,
  value2,
  value3,
  value4,
  value5,
  value6,
  value7,
  value8 = 0.15,
) {
  let values = [];
  for (let index = 0; index < value; index++) {
    let cuppedPetalGeometryResult = createCuppedPetalGeometry(
      value2 * (1 + (value7() - 0.5) * value8),
      value3 * (1 + (value7() - 0.5) * value8),
      value6,
    );
    cuppedPetalGeometryResult.rotateZ(value5 + (value7() - 0.5) * 0.12);
    cuppedPetalGeometryResult.translate(value4, 0, 0);
    cuppedPetalGeometryResult.rotateY(
      (index / value) * vegetationState.foliageFullTurn + (value7() - 0.5) * 0.12,
    );
    values.push(cuppedPetalGeometryResult);
  }
  return values;
}
