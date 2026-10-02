/** Reusable procedural creature geometry, vertex colors, ellipsoid projection and transforms. */
import { createCreatureTaperedTubeGeometry } from "./create-creature-tapered-tube-geometry.js";
export function createCreatureLimbGeometry(
  value,
  value2,
  { seg: value3 = 10, r2: value4 = value } = {},
) {
  return createCreatureTaperedTubeGeometry(
    [
      [0, 0, 0],
      [0, -value2 * 0.5, 0.001],
      [0, -value2, 0],
    ],
    (value5) => value + (value4 - value) * value5,
    {
      tSeg: 8,
      rSeg: value3,
    },
  );
}
