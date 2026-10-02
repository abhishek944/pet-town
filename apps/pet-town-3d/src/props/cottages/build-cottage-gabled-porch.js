/** Cottage variants, porch and stair layout, cottage geometry and hanging baskets. */
import * as THREE from "three";
import { propsState } from "../state.js";
import { createBeveledPropBox } from "../geometry/create-beveled-prop-box.js";
import { appendRoundWindowGeometry } from "../building-details/append-round-window-geometry.js";
import { appendGabledRoofGeometry } from "../building-details/append-gabled-roof-geometry.js";
import { extrudePropShape } from "../geometry/extrude-prop-shape.js";
import { appendFlowerPotGeometry } from "../garden-geometry/append-flower-pot-geometry.js";
import { appendHangingBasketGeometry } from "./append-hanging-basket-geometry.js";
export function buildCottageGabledPorch(cottage) {
  let result105 = cottage.porchWidth - 0.1;
  for (let result107 of [-1, 1]) {
    cottage.builder.add(`wood`, createBeveledPropBox(0.2, 2.5, 0.2, 0.05), {
      x: cottage.doorX + result107 * (result105 / 2 - 0.12),
      y: 3.5 / 2,
      z: cottage.porchStartZ + cottage.porchDepth - 0.15,
      tint: cottage.timberColor,
      uv: {
        grain: 1,
      },
    });
    cottage.builder.add(`wood`, createBeveledPropBox(0.16, 0.7, 0.16, 0.04), {
      x: cottage.doorX + result107 * (result105 / 2 - 0.35),
      y: 2.7,
      z: cottage.porchStartZ + cottage.porchDepth - 0.15,
      rz: result107 * 0.7,
      tint: cottage.timberColor,
    });
  }
  let result106 = cottage.porchStartZ + cottage.porchDepth + 0.28;
  let appendGabledRoofGeometryResult2 = appendGabledRoofGeometry(cottage.builder, {
    cx: cottage.doorX,
    yB: 3,
    cw: result105,
    z0: cottage.depth / 2 - 0.45,
    z1: result106,
    tint: cottage.roofColor,
    trim: cottage.trimColor,
  });
  let shape2 = new THREE.Shape();
  if (
    (shape2.moveTo(-result105 / 2, 0),
    shape2.lineTo(result105 / 2, 0),
    shape2.lineTo(0, appendGabledRoofGeometryResult2.apex - 3),
    shape2.closePath(),
    cottage.builder.add(cottage.wallMaterial, extrudePropShape(shape2, 0.14, 0), {
      x: cottage.doorX,
      y: 3,
      z: result106 - 0.2,
      tint: cottage.wallColor,
      uv: cottage.wallUvs,
    }),
    cottage.builder.add(`wood`, createBeveledPropBox(result105 + 0.2, 0.24, 0.24, 0.05), {
      x: cottage.doorX,
      y: 2.98,
      z: result106 - 0.2,
      tint: cottage.timberColor,
    }),
    cottage.builder.push(
      cottage.doorX,
      3 + (appendGabledRoofGeometryResult2.apex - 3) * 0.42,
      result106 - 0.1,
    ),
    appendRoundWindowGeometry(cottage.builder, cottage.random, 0.2, cottage.trimColor),
    cottage.builder.pop(),
    appendFlowerPotGeometry(
      cottage.builder,
      cottage.random,
      cottage.doorX - cottage.porchWidth / 2 + 0.4,
      cottage.floorY,
      cottage.porchStartZ + cottage.porchDepth - 0.4,
      {
        flowers: cottage.settings.flowers,
        r: 0.26,
      },
    ),
    cottage.settings.baskets)
  ) {
    for (let result108 of [-1, 1]) {
      appendHangingBasketGeometry(
        cottage.builder,
        cottage.random,
        cottage.doorX + result108 * (result105 / 2 - 0.12),
        2.7,
        cottage.porchStartZ + cottage.porchDepth - 0.15 + 0.42,
        cottage.settings.flowers ?? propsState.propPalette.pink,
      );
    }
  }
}
