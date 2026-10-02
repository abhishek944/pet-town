/** Detailed market stall geometry and decorative flat leaf geometry. */

import { createBeveledPropBox } from "../geometry/create-beveled-prop-box.js";
import { propsState } from "../state.js";
import { createHeightGradientColorizer } from "../building-details/create-height-gradient-colorizer.js";
export function buildMarketCounter(stall) {
  stall.width = 3.3;
  stall.depth = 1.8;
  stall.paintColor = stall.settings.paint ?? 10345668;
  stall.metadata = {
    lights: [],
    radius: 2,
  };
  stall.builder.add(`wood`, createBeveledPropBox(3.0999999999999996, 0.92, 0.75, 0.04), {
    y: 0.46,
    z: stall.depth / 2 - 0.4,
    tint: propsState.propPalette.woodWarm,
    uv: {
      grain: 0,
    },
  });
  stall.builder.add(`paint`, createBeveledPropBox(2.9, 0.66, 0.05, 0.015), {
    y: 0.47,
    z: stall.depth / 2 - 0.01,
    tint: stall.paintColor,
    uv: {
      grain: 1,
      scale: 1 / 1.6,
    },
    colorFn: createHeightGradientColorizer([
      [0.14, 0.82],
      [0.5, 1],
    ]),
  });
  for (let result9 of [-1, 0, 1]) {
    stall.builder.add(`wood`, createBeveledPropBox(0.1, 0.76, 0.06, 0.02), {
      x: result9 * (stall.width / 2 - 0.3),
      y: 0.47,
      z: 0.92,
      tint: propsState.propPalette.woodDark,
      uv: {
        grain: 1,
      },
    });
  }
  stall.builder.add(`wood`, createBeveledPropBox(3.3499999999999996, 0.1, 0.95, 0.03), {
    y: 0.97,
    z: stall.depth / 2 - 0.35,
    tint: propsState.propPalette.woodLight,
    uv: {
      grain: 0,
    },
  });
  stall.builder.add(`wood`, createBeveledPropBox(3, 0.08, 0.45, 0.02), {
    y: 1.25,
    z: -1.8 / 2 + 0.3,
    tint: propsState.propPalette.woodLight,
  });
  stall.builder.add(`wood`, createBeveledPropBox(3, 0.08, 0.45, 0.02), {
    y: 0.55,
    z: -1.8 / 2 + 0.3,
    tint: propsState.propPalette.woodLight,
  });
}
