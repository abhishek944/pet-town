/** Cottage variants, porch and stair layout, cottage geometry and hanging baskets. */
import * as THREE from "three";
import { propsState } from "../state.js";
import { createBeveledPropBox } from "../geometry/create-beveled-prop-box.js";
import { appendRoundWindowGeometry } from "../building-details/append-round-window-geometry.js";
import { extrudePropShape } from "../geometry/extrude-prop-shape.js";
import { createArchedPropShape } from "../geometry/create-arched-prop-shape.js";
export function buildCottageEntrance(cottage) {
  cottage.doorX = cottage.settings.doorX ?? -1;
  cottage.doorWidth = 1.1;
  cottage.doorHeight = 2.1;
  cottage.frontZ = cottage.depth / 2;
  cottage.builder.push(cottage.doorX, cottage.floorY, cottage.frontZ);
  cottage.builder.add(
    `paint`,
    extrudePropShape(createArchedPropShape(cottage.doorWidth, cottage.doorHeight), 0.12, 0.02, 12),
    {
      z: 0.03,
      tint: cottage.doorColor,
      uv: {
        grain: 1,
        scale: 1 / 1.6,
      },
    },
  );
  cottage.doorFrameShape = createArchedPropShape(1.4400000000000002, 2.27, 1.4400000000000002 / 2);
  cottage.doorFrameShape.holes.push(createArchedPropShape(cottage.doorWidth, cottage.doorHeight));
  cottage.builder.add(`paint`, extrudePropShape(cottage.doorFrameShape, 0.2, 0.03, 12), {
    z: 0.05,
    tint: cottage.trimColor,
  });
  cottage.builder.add(`metal`, new THREE.SphereGeometry(0.06, 10, 8), {
    x: cottage.doorWidth * 0.33,
    y: 1,
    z: 0.14,
    tint: propsState.propPalette.brass,
  });
  for (let result87 of [0.45, 1.45]) {
    cottage.builder.add(`metal`, createBeveledPropBox(0.55, 0.07, 0.03, 0.01), {
      x: -1.1 / 2 + 0.3,
      y: result87,
      z: 0.11,
      tint: propsState.propPalette.iron,
    });
  }
  if (
    (cottage.builder.push(0, 1.62, 0.1),
    appendRoundWindowGeometry(cottage.builder, cottage.random, 0.17, cottage.trimColor),
    cottage.builder.pop(),
    cottage.builder.pop(),
    (cottage.metadata.door = new THREE.Vector3(
      cottage.doorX,
      cottage.floorY,
      cottage.frontZ + 0.2,
    )),
    cottage.metadata.windows.push({
      x: cottage.doorX,
      y: 2.1,
      z: cottage.frontZ + 0.1,
      nx: 0,
      nz: 1,
      door: true,
    }),
    cottage.hasPlasterWalls)
  ) {
    for (let result88 of [-1, 1]) {
      cottage.builder.add(`wood`, createBeveledPropBox(0.2, cottage.wallHeight - 0.2, 0.2, 0.04), {
        x: cottage.doorX + result88 * 0.91,
        y: cottage.floorY + (cottage.wallHeight - 0.2) / 2,
        z: cottage.frontZ,
        tint: cottage.timberColor,
        uv: {
          grain: 1,
        },
      });
    }
  }
}
