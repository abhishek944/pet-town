/** Cottage variants, porch and stair layout, cottage geometry and hanging baskets. */

import { propsState } from "../state.js";
import { createBeveledPropBox } from "../geometry/create-beveled-prop-box.js";
import { createHeightGradientColorizer } from "../building-details/create-height-gradient-colorizer.js";
import { createSubdividedPropBox } from "../geometry/create-subdivided-prop-box.js";
import { createBuildingWallColorizer } from "../building-details/create-building-wall-colorizer.js";
import { createPropGableWedge } from "../geometry/create-prop-gable-wedge.js";
export function buildCottageFoundation(cottage) {
  cottage.builder.add(
    `stone`,
    createBeveledPropBox(cottage.width + 0.5, cottage.foundationHeight, cottage.depth + 0.5, 0.09),
    {
      y: cottage.floorY - cottage.foundationHeight / 2,
      tint: propsState.propPalette.stone,
      uv: {
        scale: 1 / 2.2,
      },
      colorFn: createHeightGradientColorizer([
        [-cottage.foundationDepth, 0.75],
        [0.1, 0.85],
        [cottage.floorY, 1],
      ]),
    },
  );
  cottage.builder.add(
    cottage.wallMaterial,
    createSubdividedPropBox(cottage.width, cottage.wallHeight, cottage.depth, 0.33),
    {
      y: cottage.floorY + cottage.wallHeight / 2,
      tint: cottage.wallColor,
      colorFn: createBuildingWallColorizer(
        cottage.width,
        cottage.depth,
        cottage.floorY,
        cottage.eaveY,
        cottage.wallNoiseSeed,
      ),
      uv: cottage.wallUvs,
    },
  );
  cottage.gableGeometry = createPropGableWedge(
    cottage.width - 0.04,
    (cottage.depth / 2) * cottage.roofSlope,
    cottage.depth,
    0.33,
  );
}
