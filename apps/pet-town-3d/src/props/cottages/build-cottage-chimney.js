/** Cottage variants, porch and stair layout, cottage geometry and hanging baskets. */
import * as THREE from "three";
import { propsState } from "../state.js";
import { createBeveledPropBox } from "../geometry/create-beveled-prop-box.js";
import { createHeightGradientColorizer } from "../building-details/create-height-gradient-colorizer.js";
import { createTaperedSquareColumn } from "../building-details/create-tapered-square-column.js";
import { createBeveledPropCylinder } from "../geometry/create-beveled-prop-cylinder.js";
export function buildCottageChimney(cottage) {
  if (cottage.hasChimney) {
    let result77 = cottage.width < 5.5;
    let result78 = result77 ? 0.7 : 0.8;
    let result79 = result77 ? 0.95 : 1;
    let result80 = cottage.settings.chimney === `brick` ? `brick` : `stone`;
    let result81 = result80 === `brick` ? 13662812 : propsState.propPalette.stone;
    let stoneDark2 = propsState.propPalette.stoneDark;
    let result82 = cottage.width / 2 + 0.2 + result78 / 2 + 0.05;
    let result83 = -0.55;
    let result84 = cottage.ridgeY + 0.45;
    let result85 = cottage.eaveY - 0.4;
    let options3 = {
      scale: result80 === `brick` ? 1 / 1.6 : 1 / 2,
    };
    cottage.builder.add(
      result80,
      createBeveledPropBox(result79, result85 + cottage.foundationDepth, result79 * 0.92, 0.08),
      {
        x: result82 + 0.04,
        y: (result85 - cottage.foundationDepth) / 2,
        z: result83,
        tint: result81,
        uv: options3,
        colorFn: createHeightGradientColorizer([
          [-cottage.foundationDepth, 0.7],
          [0.6, 0.92],
          [1.6, 1],
        ]),
      },
    );
    cottage.builder.add(result80, createTaperedSquareColumn(result78, result79, 0.5), {
      x: result82 + 0.02,
      y: result85 + 0.25,
      z: result83,
      tint: result81,
      uv: options3,
    });
    cottage.builder.add(
      result80,
      createBeveledPropBox(result78, result84 - result85 - 0.5, result78, 0.06),
      {
        x: result82,
        y: (result84 + result85 + 0.5) / 2,
        z: result83,
        tint: result81,
        uv: options3,
        colorFn: createHeightGradientColorizer([
          [result84 - 0.6, 1],
          [result84, 0.72],
        ]),
      },
    );
    cottage.builder.add(
      `stone`,
      createBeveledPropBox(result78 + 0.22, 0.18, result78 + 0.22, 0.05),
      {
        x: result82,
        y: result84 + 0.07,
        z: result83,
        tint: stoneDark2,
      },
    );
    for (let result86 of result77 ? [0] : [-0.2, 0.2]) {
      cottage.builder.add(`plain`, createBeveledPropCylinder(0.12, 0.34, 10, 0.04), {
        x: result82,
        y: result84 + 0.15,
        z: result83 + result86,
        tint: propsState.propPalette.terracotta,
        colorFn: createHeightGradientColorizer([
          [result84 + 0.3, 1],
          [result84 + 0.5, 0.45],
        ]),
      });
    }
    cottage.metadata.chimney = new THREE.Vector3(result82, result84 + 0.5 + 0.25, result83);
    cottage.metadata.colliders.push({
      x: result82 + 0.04,
      z: result83,
      w: result79,
      d: result79 * 0.92,
      radius: result79 * 0.62,
      y0: -cottage.foundationDepth,
      h: result84 + 0.3 + cottage.foundationDepth,
      noTop: true,
    });
  }
}
