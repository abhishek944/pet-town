/** Tree palettes, trunks, broadleaf crowns, fruit, pine tiers and palm fronds. */

import { foliageColorToRgb } from "../geometry-helpers/foliage-color-to-rgb.js";
import { mixFoliageRgb } from "../geometry-helpers/mix-foliage-rgb.js";
import { vegetationState } from "../state.js";
import { bakeFoliageVertexAttributes } from "../geometry-helpers/bake-foliage-vertex-attributes.js";
import { createFoliageEllipsoid } from "../geometry-helpers/create-foliage-ellipsoid.js";
import { clampFoliageUnit } from "../geometry-helpers/clamp-foliage-unit.js";
export function buildPalmCoconuts(palm) {
  palm.coconutCount = 2 + Math.floor(palm.random() * 3);
  for (let index9 = 0; index9 < palm.coconutCount; index9++) {
    let result37 = palm.random() * vegetationState.foliageFullTurn;
    let foliageEllipsoidResult2 = createFoliageEllipsoid(0.17, 8, 6);
    foliageEllipsoidResult2.translate(
      palm.crownCenter.x + Math.cos(result37) * 0.26,
      palm.crownCenter.y - 0.2,
      palm.crownCenter.z + Math.sin(result37) * 0.26,
    );
    palm.crownParts.push(
      bakeFoliageVertexAttributes(foliageEllipsoidResult2, (value12, yValue2) => ({
        c: mixFoliageRgb(
          foliageColorToRgb(`#4a3018`),
          foliageColorToRgb(`#8a6034`),
          clampFoliageUnit(yValue2.y * 0.5 + 0.5),
        ),
        s: 1.4,
        t: 0,
      })),
    );
  }
}
