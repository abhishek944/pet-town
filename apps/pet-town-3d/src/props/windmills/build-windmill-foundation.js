/** Windmill tower and separately animated sail geometry. */

import { mixPropScalar } from "../math/mix-prop-scalar.js";
import { clampPropValue } from "../math/clamp-prop-value.js";
import { createPropLathe } from "../geometry/create-prop-lathe.js";
import { propsState } from "../state.js";
import { createHeightGradientColorizer } from "../building-details/create-height-gradient-colorizer.js";
export function buildWindmillFoundation(windmill) {
  windmill.foundationDepth = Math.max(0.3, windmill.settings.found ?? 0.3);
  windmill.towerHeight = 6.8;
  windmill.topRadius = 1.4;
  windmill.radiusAtHeight = (value2) =>
    mixPropScalar(2.05, windmill.topRadius, clampPropValue((value2 - 0.6) / 6.2));
  windmill.metadata = {
    lights: [],
    walk: [],
    colliders: [],
  };
  windmill.builder.add(
    `stone`,
    createPropLathe(
      [
        [0, -windmill.foundationDepth],
        [2.45, -windmill.foundationDepth],
        [2.45, 0.5],
        [2.3, 0.66],
        [0, 0.66],
      ],
      8,
      true,
      Math.PI / 8,
    ),
    {
      tint: propsState.propPalette.stone,
      uv: {
        scale: 1 / 2.2,
      },
      colorFn: createHeightGradientColorizer([
        [-windmill.foundationDepth, 0.72],
        [0.2, 0.9],
        [0.66, 1],
      ]),
    },
  );
}
