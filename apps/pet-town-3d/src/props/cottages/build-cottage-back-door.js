/** Cottage variants, porch and stair layout, cottage geometry and hanging baskets. */
import * as THREE from "three";
import { propsState } from "../state.js";
import { createBeveledPropBox } from "../geometry/create-beveled-prop-box.js";
import { shadeBuildingColor } from "../building-details/shade-building-color.js";
import { extrudePropShape } from "../geometry/extrude-prop-shape.js";
import { createArchedPropShape } from "../geometry/create-arched-prop-shape.js";
import { clonePropColor } from "../geometry-builder/clone-prop-color.js";
export function buildCottageBackDoor(cottage) {
  if (cottage.settings.backDoor) {
    cottage.builder.push(0, cottage.floorY, -cottage.depth / 2, 0, Math.PI, 0);
    cottage.builder.add(`paint`, extrudePropShape(createArchedPropShape(0.95, 2), 0.12, 0.02, 12), {
      z: 0.03,
      tint: shadeBuildingColor(cottage.doorColor, 0.92),
      uv: {
        grain: 1,
        scale: 1 / 1.6,
      },
    });
    let archedPropShapeResult2 = createArchedPropShape(1.25, 2.12, 0.625);
    archedPropShapeResult2.holes.push(createArchedPropShape(0.95, 2));
    cottage.builder.add(`paint`, extrudePropShape(archedPropShapeResult2, 0.18, 0.03, 12), {
      z: 0.05,
      tint: cottage.trimColor,
    });
    cottage.builder.add(`metal`, new THREE.SphereGeometry(0.05, 8, 6), {
      x: 0.28,
      y: 0.98,
      z: 0.13,
      tint: propsState.propPalette.brass,
    });
    for (let result120 of [0.4, 1.5]) {
      cottage.builder.add(`metal`, createBeveledPropBox(0.5, 0.06, 0.03, 0.01), {
        x: -0.2,
        y: result120,
        z: 0.1,
        tint: propsState.propPalette.iron,
      });
    }
    cottage.builder.pop();
    let result115 = Math.min(0, cottage.settings.backGround ?? 0);
    let result116 = -cottage.depth / 2 - 0.25 - 0.3;
    let result117 = result115 - Math.max(0.3, cottage.foundationDepth * 0.5);
    cottage.builder.add(`stone`, createBeveledPropBox(1.5, cottage.floorY - result117, 0.6, 0.06), {
      y: (cottage.floorY + result117) / 2 - 0.02,
      z: result116,
      tint: propsState.propPalette.stone,
      uv: {
        scale: 1 / 2,
      },
    });
    cottage.metadata.walk.push({
      cx: 0,
      cz: result116,
      hw: 0.75,
      hd: 0.3,
      y: 0.48,
    });
    let result118 = Math.max(0, Math.round((cottage.floorY - result115) / 0.27) - 1);
    let result119 = (cottage.floorY - result115) / (result118 + 1);
    for (let index4 = 0; index4 < result118; index4++) {
      let result121 = cottage.floorY - (index4 + 1) * result119;
      let result122 = result116 - 0.3 - 0.2 - index4 * 0.4;
      cottage.builder.add(
        `stone`,
        createBeveledPropBox(
          1.3 + cottage.random.range(-0.05, 0.05),
          result121 - result117,
          0.44,
          0.06,
        ),
        {
          y: (result121 + result117) / 2,
          z: result122,
          tint: clonePropColor(propsState.propPalette.stone).multiplyScalar(
            cottage.random.range(0.9, 1.02),
          ),
          uv: {
            scale: 1 / 2,
          },
        },
      );
      cottage.metadata.walk.push({
        cx: 0,
        cz: result122,
        hw: 0.65,
        hd: 0.2,
        y: result121,
      });
    }
    cottage.metadata.windows.push({
      x: 0,
      y: 2.1,
      z: -cottage.depth / 2 - 0.1,
      nx: 0,
      nz: -1,
      door: true,
    });
    cottage.metadata.clear.push({
      x: 0,
      z: result116 - 0.4,
      r: 1.1,
    });
  }
}
