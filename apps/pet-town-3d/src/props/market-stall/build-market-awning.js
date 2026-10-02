/** Detailed market stall geometry and decorative flat leaf geometry. */
import * as THREE from "three";
import { createBeveledPropBox } from "../geometry/create-beveled-prop-box.js";
import { propsState } from "../state.js";
import { extrudePropShape } from "../geometry/extrude-prop-shape.js";
export function buildMarketAwning(stall) {
  stall.frontPostHeight = 2.35;
  stall.backPostHeight = 2.8;
  for (let result14 of [-1, 1]) {
    stall.builder.add(`wood`, createBeveledPropBox(0.15, stall.frontPostHeight, 0.15, 0.04), {
      x: result14 * (stall.width / 2 - 0.05),
      y: stall.frontPostHeight / 2,
      z: 0.9500000000000001,
      tint: propsState.propPalette.timber,
      uv: {
        grain: 1,
      },
    });
    stall.builder.add(`wood`, createBeveledPropBox(0.15, stall.backPostHeight, 0.15, 0.04), {
      x: result14 * (stall.width / 2 - 0.05),
      y: stall.backPostHeight / 2,
      z: -0.85,
      tint: propsState.propPalette.timber,
      uv: {
        grain: 1,
      },
    });
    stall.builder.add(`wood`, createBeveledPropBox(0.12, 0.12, stall.depth, 0.03), {
      x: result14 * (stall.width / 2 - 0.05),
      y: 1.9,
      z: 0.05,
      tint: propsState.propPalette.timber,
    });
  }
  stall.builder.add(`wood`, createBeveledPropBox(3.4, 0.14, 0.14, 0.03), {
    y: 2.2800000000000002,
    z: 0.9500000000000001,
    tint: propsState.propPalette.timber,
  });
  stall.builder.add(`wood`, createBeveledPropBox(3.4, 0.14, 0.14, 0.03), {
    y: 2.73,
    z: -0.85,
    tint: propsState.propPalette.timber,
  });
  stall.awningLength = Math.hypot(2.6, 0.5999999999999996);
  stall.awningPitch = Math.atan2(0.5999999999999996, 2.6);
  stall.awningWidth = 3.6;
  stall.clothUvs = {
    grain: 0,
    scale: 1 / 1.6,
    ou: 0.125,
    ov: 0,
  };
  stall.builder.add(
    `cloth`,
    createBeveledPropBox(stall.awningWidth, 0.05, stall.awningLength, 0.02),
    {
      y: 5.1 / 2 + 0.05,
      z: 0.5 / 2,
      rx: stall.awningPitch,
      noAO: true,
      uv: stall.clothUvs,
    },
  );
  stall.scallopWidth = stall.awningWidth / 9;
  for (let index2 = 0; index2 < 9; index2++) {
    let result15 = -3.6 / 2 + (index2 + 0.5) * stall.scallopWidth;
    let shape = new THREE.Shape();
    shape.moveTo(-0.4 / 2, 0);
    shape.lineTo(stall.scallopWidth / 2, 0);
    shape.lineTo(stall.scallopWidth / 2, -0.1);
    shape.absarc(0, -0.1, stall.scallopWidth / 2, 0, -Math.PI, true);
    shape.lineTo(-0.4 / 2, 0);
    let extrudePropShapeResult = extrudePropShape(shape, 0.03, 0.006, 8);
    extrudePropShapeResult.translate(result15, 0, 0);
    stall.builder.add(`cloth`, extrudePropShapeResult, {
      y: 2.29,
      z: 1.56,
      noAO: true,
      uv: stall.clothUvs,
    });
  }
  for (let result16 of [-1, 1]) {
    stall.builder.push(
      result16 * (stall.awningWidth / 2 - 0.01),
      5.1 / 2 + 0.05,
      0.5 / 2,
      stall.awningPitch,
      0,
      0,
    );
    stall.builder.add(`cloth`, createBeveledPropBox(0.03, 0.24, stall.awningLength, 0.008), {
      y: -0.12,
      noAO: true,
      uv: {
        grain: 2,
        scale: 1 / 1.6,
        ou: 0.125,
      },
    });
    stall.builder.pop();
  }
}
