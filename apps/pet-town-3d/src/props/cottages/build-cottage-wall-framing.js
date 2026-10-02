/** Cottage variants, porch and stair layout, cottage geometry and hanging baskets. */

import { createBeveledPropBox } from "../geometry/create-beveled-prop-box.js";
import { createBuildingWallColorizer } from "../building-details/create-building-wall-colorizer.js";
import { shadeBuildingColor } from "../building-details/shade-building-color.js";
export function buildCottageWallFraming(cottage) {
  if (
    (cottage.builder.add(cottage.wallMaterial, cottage.gableGeometry, {
      y: cottage.eaveY,
      tint: cottage.wallColor,
      colorFn: createBuildingWallColorizer(
        cottage.width,
        cottage.depth,
        cottage.eaveY - 1,
        cottage.eaveY + (cottage.depth / 2) * cottage.roofSlope,
        cottage.wallNoiseSeed,
        cottage.eaveY + (cottage.depth / 2) * cottage.roofSlope,
      ),
      uv: cottage.hasPlasterWalls
        ? undefined
        : {
            grain: 2,
            scale: 1 / 2.4,
          },
    }),
    cottage.hasPlasterWalls)
  ) {
    for (let result33 of [-1, 1]) {
      for (let result34 of [-1, 1]) {
        cottage.builder.add(
          `wood`,
          createBeveledPropBox(0.34, cottage.wallHeight + 0.04, 0.34, 0.05),
          {
            x: (result33 * cottage.width) / 2,
            y: cottage.floorY + cottage.wallHeight / 2,
            z: (result34 * cottage.depth) / 2,
            tint: cottage.timberColor,
            uv: {
              grain: 1,
            },
          },
        );
      }
    }
    for (let result35 of [-1, 1]) {
      for (let [result36, result37] of [
        [0.63, 0.26],
        [cottage.eaveY - 0.14, 0.28],
      ]) {
        cottage.builder.add(`wood`, createBeveledPropBox(cottage.width, result37, 0.22, 0.05), {
          y: result36,
          z: (result35 * cottage.depth) / 2,
          tint: cottage.timberColor,
          jitter: 0.04,
        });
      }
    }
    for (let result38 of [-1, 1]) {
      for (let [result39, result40] of [
        [0.63, 0.26],
        [cottage.eaveY - 0.14, 0.28],
      ]) {
        cottage.builder.add(`wood`, createBeveledPropBox(0.22, result40, cottage.depth, 0.05), {
          x: (result38 * cottage.width) / 2,
          y: result39,
          tint: cottage.timberColor,
          jitter: 0.04,
        });
      }
    }
    for (let result41 of [-1, 1]) {
      for (let result42 of [-1, 1]) {
        let result43 = result42 * (cottage.depth / 2 - 0.25);
        let result44 = result42 * (cottage.depth / 2 - 1.15);
        let result45 = 0.8;
        let result46 = cottage.eaveY - 0.3;
        let hypotResult = Math.hypot(result44 - result43, result46 - result45);
        let atan2Result = Math.atan2(result44 - result43, result46 - result45);
        cottage.builder.add(`wood`, createBeveledPropBox(0.2, hypotResult, 0.2, 0.04), {
          x: (result41 * cottage.width) / 2,
          y: (result45 + result46) / 2,
          z: (result43 + result44) / 2,
          rx: atan2Result,
          tint: cottage.timberColor,
          uv: {
            grain: 1,
          },
        });
      }
    }
    for (let result47 of [-1, 1]) {
      let result48 = result47 * (cottage.width / 2 - 0.25);
      let result49 = result47 * (cottage.width / 2 - 1.3);
      let result50 = 0.8;
      let result51 = cottage.eaveY - 0.3;
      let hypotResult2 = Math.hypot(result49 - result48, result51 - result50);
      let atan2Result2 = Math.atan2(result49 - result48, result51 - result50);
      cottage.builder.add(`wood`, createBeveledPropBox(hypotResult2, 0.2, 0.2, 0.04), {
        x: (result48 + result49) / 2,
        y: (result50 + result51) / 2,
        z: -cottage.depth / 2,
        rz: Math.PI / 2 - atan2Result2,
        tint: cottage.timberColor,
        uv: {
          grain: 0,
        },
      });
    }
    for (let result52 of [-1, 1]) {
      cottage.builder.add(`wood`, createBeveledPropBox(0.2, 0.2, cottage.depth * 0.62, 0.04), {
        x: (result52 * cottage.width) / 2,
        y: cottage.eaveY + (cottage.depth / 2) * cottage.roofSlope * 0.28,
        tint: cottage.timberColor,
      });
    }
  } else {
    for (let result53 of [-1, 1]) {
      for (let result54 of [-1, 1]) {
        cottage.builder.add(
          `paint`,
          createBeveledPropBox(0.26, cottage.wallHeight + 0.04, 0.26, 0.05),
          {
            x: (result53 * cottage.width) / 2,
            y: cottage.floorY + cottage.wallHeight / 2,
            z: (result54 * cottage.depth) / 2,
            tint: cottage.trimColor,
            uv: {
              grain: 1,
            },
          },
        );
      }
    }
    for (let result55 of [-1, 1]) {
      cottage.builder.add(`paint`, createBeveledPropBox(cottage.width + 0.1, 0.2, 0.18, 0.04), {
        y: cottage.eaveY - 0.1,
        z: (result55 * cottage.depth) / 2,
        tint: cottage.trimColor,
      });
    }
    for (let result56 of [-1, 1]) {
      cottage.builder.add(`paint`, createBeveledPropBox(0.18, 0.2, cottage.depth + 0.1, 0.04), {
        x: (result56 * cottage.width) / 2,
        y: cottage.eaveY - 0.1,
        tint: cottage.trimColor,
      });
    }
    cottage.builder.add(`paint`, createBeveledPropBox(cottage.width + 0.08, 0.16, 0.12, 0.03), {
      y: 0.58,
      z: cottage.depth / 2 + 0.02,
      tint: shadeBuildingColor(cottage.wallColor, 0.7),
    });
  }
}
