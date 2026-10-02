/** Cottage variants, porch and stair layout, cottage geometry and hanging baskets. */
import * as THREE from "three";
import { propsState } from "../state.js";
import { createBeveledPropBox } from "../geometry/create-beveled-prop-box.js";
import { createBeveledPropCylinder } from "../geometry/create-beveled-prop-cylinder.js";
import { clonePropColor } from "../geometry-builder/clone-prop-color.js";
export function buildCottageWoodpile(cottage) {
  if (cottage.settings.woodpile) {
    let result123 = 0.12;
    let result124 = 0.75;
    let result125 = -cottage.width / 2 + 0.55;
    let result126 = -cottage.depth / 2 - 0.25 - result124 / 2;
    let result127 = 6 * result123 * 2;
    cottage.builder.add(`wood`, createBeveledPropBox(1.74, 0.1, 0.85, 0.03), {
      x: result125 + result127 / 2 - result123,
      y: 0.05,
      z: result126,
      tint: propsState.propPalette.woodDark,
    });
    for (let index5 = 0; index5 < 4; index5++) {
      for (let index6 = 0; index6 < 6 - (index5 % 2); index6++) {
        let result130 = result123 * cottage.random.range(0.82, 1.18);
        let result131 =
          result125 +
          index6 * result123 * 2 +
          (index5 % 2 ? result123 : 0) +
          cottage.random.range(-0.015, 0.015);
        let result132 = 0.22 + index5 * result123 * 1.74 + (result130 - result123) * 0.5;
        let rangeResult = cottage.random.range(-0.06, 0.06);
        cottage.builder.push(
          result131,
          result132,
          result126 + rangeResult,
          Math.PI / 2,
          cottage.random.range(-0.05, 0.05),
          0,
        );
        cottage.builder.add(`wood`, createBeveledPropCylinder(result130, result124, 8, 0.02), {
          y: -0.75 / 2,
          tint: propsState.propPalette.bark,
          jitter: 0.12,
          uv: {
            mode: `native`,
            su: 0.4,
            sv: 0.5,
            swap: true,
          },
        });
        cottage.builder.add(`plain`, new THREE.CircleGeometry(result130 * 0.88, 9), {
          y: -0.75 / 2 - 0.004,
          rx: Math.PI / 2,
          tint: clonePropColor(15387030).multiplyScalar(cottage.random.range(0.88, 1.05)),
          colorFn: (multiplyScalarValue, value5, value6) =>
            multiplyScalarValue.multiplyScalar(
              0.8 + 0.2 * Math.cos(Math.hypot(value5 - result131, value6 - result132) * 75),
            ),
        });
        cottage.builder.pop();
      }
    }
    for (let result133 of [-1, 1]) {
      cottage.builder.add(`wood`, createBeveledPropBox(0.09, 1.2351999999999999, 0.09, 0.02), {
        x: result125 - result123 + (result133 > 0 ? result127 : 0) + result133 * 0.06,
        y: 1.2351999999999999 / 2,
        z: result126 - result124 / 2 + 0.08,
        tint: propsState.propPalette.woodDark,
        uv: {
          grain: 1,
        },
      });
    }
    for (let index7 = 0; index7 < 3; index7++) {
      cottage.builder.add(`wood`, createBeveledPropBox(1.79, 0.05, 0.3, 0.015), {
        x: result125 + result127 / 2 - result123,
        y: 1.1452 + index7 * 0.04,
        z: result126 - result124 / 2 + 0.12 + index7 * 0.26,
        rx: 0.2,
        tint: propsState.propPalette.woodWarm,
        jitter: 0.08,
        uv: {
          grain: 0,
        },
      });
    }
    cottage.metadata.colliders.push({
      x: result125 + result127 / 2 - result123,
      z: result126,
      w: 1.74,
      d: 0.85,
      radius: 0.9,
      h: 1.2351999999999999,
      noTop: true,
    });
    let result128 = result125 + result127 + 0.45;
    let result129 = result126 + 0.25;
    cottage.builder.add(`wood`, createBeveledPropCylinder(0.24, 0.42, 12, 0.04), {
      x: result128,
      z: result129,
      tint: propsState.propPalette.bark,
      uv: {
        mode: `native`,
        su: 0.8,
        sv: 0.3,
        swap: true,
      },
    });
    cottage.builder.add(`plain`, new THREE.CircleGeometry(0.21, 14), {
      x: result128,
      y: 0.425,
      z: result129,
      rx: -Math.PI / 2,
      tint: 15255704,
      colorFn: (multiplyScalarValue2, value7, value8, value9) =>
        multiplyScalarValue2.multiplyScalar(
          0.82 + 0.18 * Math.cos(Math.hypot(value7 - result128, value9 - result129) * 70),
        ),
    });
    cottage.builder.push(result128 + 0.26, 0, result129 - 0.05, 0, -0.4, 0.35);
    cottage.builder.add(`wood`, createBeveledPropCylinder(0.025, 0.75, 6, 0.01), {
      tint: propsState.propPalette.woodLight,
      uv: {
        grain: 1,
      },
    });
    cottage.builder.add(`metal`, createBeveledPropBox(0.2, 0.1, 0.03, 0.01), {
      x: 0.07,
      y: 0.72,
      tint: 9080470,
    });
    cottage.builder.pop();
    for (let index8 = 0; index8 < 3; index8++) {
      cottage.builder.add(`wood`, createBeveledPropBox(0.1, 0.07, 0.34, 0.02), {
        x: result128 + cottage.random.range(-0.4, 0.2),
        y: 0.035,
        z: result129 + 0.35 + cottage.random.range(-0.1, 0.15),
        ry: cottage.random.next() * 3,
        tint: 14200954,
      });
    }
    cottage.metadata.colliders.push({
      x: result128,
      z: result129,
      radius: 0.25,
      h: 0.43,
    });
  }
}
