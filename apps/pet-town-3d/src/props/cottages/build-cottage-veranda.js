/** Cottage variants, porch and stair layout, cottage geometry and hanging baskets. */

import { propsState } from "../state.js";
import { createBeveledPropBox } from "../geometry/create-beveled-prop-box.js";
import { buildBenchProp } from "../street-furniture/build-bench-prop.js";
import { appendFlowerPotGeometry } from "../garden-geometry/append-flower-pot-geometry.js";
export function buildCottageVeranda(cottage) {
  let result92 = cottage.depth / 2 + 0.5;
  let result93 = cottage.eaveY - 0.5 * cottage.roofSlope - 0.2;
  let result94 = 0.21;
  let result95 = cottage.porchStartZ + cottage.porchDepth + 0.3;
  let result96 = result93 - (result95 - result92) * Math.tan(result94);
  let result97 = (result95 - result92) / Math.cos(result94);
  cottage.builder.add(
    `shingle`,
    createBeveledPropBox(cottage.porchWidth + 0.35, 0.2, result97, 0.06),
    {
      x: cottage.porch.cx,
      y: (result93 + result96) / 2 + 0.1,
      z: (result92 + result95) / 2,
      rx: result94,
      tint: cottage.roofColor,
      noAO: true,
      uv: {
        grain: 0,
        flipV: true,
      },
    },
  );
  cottage.builder.add(`paint`, createBeveledPropBox(cottage.porchWidth + 0.4, 0.22, 0.09, 0.03), {
    x: cottage.porch.cx,
    y: result96 - 0.02,
    z: result95 + 0.02,
    tint: cottage.trimColor,
    noAO: true,
  });
  let result98 = cottage.porchStartZ + cottage.porchDepth - 0.15;
  let result99 = result93 - (result98 - result92) * Math.tan(result94) - 0.12;
  cottage.builder.add(`wood`, createBeveledPropBox(cottage.porchWidth, 0.18, 0.18, 0.04), {
    x: cottage.porch.cx,
    y: result99 - 0.09,
    z: result98,
    tint: cottage.timberColor,
  });
  let values2 = [-(cottage.porchWidth / 2 - 0.15), -0.95, 0.95, cottage.porchWidth / 2 - 0.15];
  for (let result100 of values2) {
    cottage.builder.add(
      `paint`,
      createBeveledPropBox(0.18, result99 - cottage.floorY, 0.18, 0.04),
      {
        x: cottage.porch.cx + result100,
        y: (result99 + cottage.floorY) / 2,
        z: result98,
        tint: cottage.trimColor,
        uv: {
          grain: 1,
        },
      },
    );
    for (let result101 of [-1, 1]) {
      if (Math.abs(result100) > 1 || result101 * result100 > 0) {
        cottage.builder.add(`paint`, createBeveledPropBox(0.12, 0.5, 0.12, 0.03), {
          x: cottage.porch.cx + result100 + result101 * 0.18,
          y: result99 - 0.27,
          z: result98,
          rz: -result101 * 0.75,
          tint: cottage.trimColor,
        });
      }
    }
  }
  let callback = (value, value2, value3, value4) => {
    let hypotResult3 = Math.hypot(value3 - value, value4 - value2);
    let atan2Result3 = Math.atan2(value3 - value, value4 - value2);
    cottage.metadata.segs.push({
      x1: value,
      z1: value2,
      x2: value3,
      z2: value4,
      r: 0.07,
      y0: 0.4,
      h: 0.9,
    });
    cottage.builder.push(
      (value + value3) / 2,
      cottage.floorY,
      (value2 + value4) / 2,
      0,
      atan2Result3,
      0,
    );
    cottage.builder.add(`paint`, createBeveledPropBox(0.1, 0.08, hypotResult3, 0.02), {
      y: 0.72,
      tint: cottage.trimColor,
      uv: {
        grain: 2,
      },
    });
    cottage.builder.add(`paint`, createBeveledPropBox(0.06, 0.06, hypotResult3, 0.015), {
      y: 0.14,
      tint: cottage.trimColor,
      uv: {
        grain: 2,
      },
    });
    let result102 = Math.max(2, Math.round(hypotResult3 / 0.22));
    for (let result103 = 1; result103 < result102; result103++) {
      cottage.builder.add(`paint`, createBeveledPropBox(0.06, 0.56, 0.06, 0.015), {
        y: 0.42,
        z: -hypotResult3 / 2 + (result103 * hypotResult3) / result102,
        tint: cottage.trimColor,
        uv: {
          grain: 1,
        },
      });
    }
    cottage.builder.pop();
  };
  for (let result104 of [-1, 1]) {
    callback(
      cottage.porch.cx + result104 * (cottage.porchWidth / 2 - 0.15),
      cottage.porchStartZ + 0.1,
      cottage.porch.cx + result104 * (cottage.porchWidth / 2 - 0.15),
      result98,
    );
    callback(
      cottage.porch.cx + result104 * (cottage.porchWidth / 2 - 0.15),
      result98,
      cottage.porch.cx + result104 * 0.95,
      result98,
    );
  }
  cottage.porchRoofY = result99;
  cottage.builder.push(
    cottage.porch.cx - cottage.porchWidth / 2 + 0.55,
    cottage.floorY,
    cottage.porchStartZ + 0.95,
    0,
    Math.PI / 2,
    0,
  );
  buildBenchProp(cottage.builder, cottage.random, {
    w: 1.2,
    tint: propsState.propPalette.woodLight,
  });
  cottage.builder.pop();
  appendFlowerPotGeometry(
    cottage.builder,
    cottage.random,
    cottage.porch.cx + cottage.porchWidth / 2 - 0.55,
    cottage.floorY,
    cottage.porchStartZ + 0.4,
    {
      flowers: cottage.settings.flowers,
      r: 0.2,
    },
  );
  appendFlowerPotGeometry(
    cottage.builder,
    cottage.random,
    cottage.porch.cx + 0.72,
    cottage.floorY,
    result98 - 0.3,
    {
      flowers: 16747115,
      r: 0.16,
    },
  );
}
