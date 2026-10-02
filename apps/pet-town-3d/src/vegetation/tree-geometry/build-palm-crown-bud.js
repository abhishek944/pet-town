/** Tree palettes, trunks, broadleaf crowns, fruit, pine tiers and palm fronds. */

import { foliageColorToRgb } from "../geometry-helpers/foliage-color-to-rgb.js";
import { mixFoliageRgb } from "../geometry-helpers/mix-foliage-rgb.js";
import { bakeFoliageVertexAttributes } from "../geometry-helpers/bake-foliage-vertex-attributes.js";
import { createFoliageEllipsoid } from "../geometry-helpers/create-foliage-ellipsoid.js";
import { clampFoliageUnit } from "../geometry-helpers/clamp-foliage-unit.js";
export function buildPalmCrownBud(palm) {
  palm.crownCenter = palm.trunkCurve.getPointAt(1);
  palm.crownParts = [];
  palm.crownBud = createFoliageEllipsoid(0.34, 8, 6);
  palm.crownBud.translate(palm.crownCenter.x, palm.crownCenter.y + 0.05, palm.crownCenter.z);
  palm.crownParts.push(
    bakeFoliageVertexAttributes(palm.crownBud, (value5, yValue) => ({
      c: mixFoliageRgb(
        foliageColorToRgb(`#5a7a2c`),
        foliageColorToRgb(`#8cae44`),
        clampFoliageUnit(yValue.y * 0.5 + 0.5),
      ),
      s: 1.4,
      t: 0,
    })),
  );
  palm.frondCount = palm.settings.fronds ?? 8;
  palm.leafDark = foliageColorToRgb(`#23703a`);
  palm.leafMid = foliageColorToRgb(`#3f9e3e`);
  palm.leafLight = foliageColorToRgb(`#8fd05a`);
  palm.leafTip = foliageColorToRgb(`#a6d45e`);
}
