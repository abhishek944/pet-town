/** Cottage variants, porch and stair layout, cottage geometry and hanging baskets. */
import * as THREE from "three";
import { createBeveledPropBox } from "../geometry/create-beveled-prop-box.js";
import { createHeightGradientColorizer } from "../building-details/create-height-gradient-colorizer.js";
import { shadeBuildingColor } from "../building-details/shade-building-color.js";
import { appendRoundWindowGeometry } from "../building-details/append-round-window-geometry.js";
export function buildCottageMainRoof(cottage) {
  cottage.hasChimney = !!cottage.settings.chimney;
  for (let result57 of [-1, 1]) {
    cottage.builder.push(
      result57 * (cottage.width / 2 + 0.02),
      cottage.eaveY + (cottage.depth / 2) * cottage.roofSlope * 0.5,
      result57 > 0 && cottage.hasChimney ? 0.5 : 0,
      0,
      (result57 * Math.PI) / 2,
      0,
    );
    appendRoundWindowGeometry(
      cottage.builder,
      cottage.random,
      cottage.width < 5.5 ? 0.26 : 0.32,
      cottage.trimColor,
    );
    cottage.builder.pop();
  }
  cottage.roofHalfDepth = cottage.depth / 2 + cottage.eaveOverhang;
  cottage.roofPanelLength =
    cottage.roofHalfDepth / Math.cos(cottage.roofPitch) +
    0.5 * cottage.roofThickness * cottage.roofSlope +
    0.03;
  for (let result58 of [1, -1]) {
    let result59 = (result58 * cottage.roofHalfDepth) / 2;
    let result60 =
      cottage.eaveY + (cottage.depth / 2 - cottage.roofHalfDepth / 2) * cottage.roofSlope;
    let result61 = Math.cos(cottage.roofPitch);
    let result62 = Math.sin(cottage.roofPitch);
    let result63 = result60 + (result61 * cottage.roofThickness) / 2;
    let result64 = result59 + (result58 * result62 * cottage.roofThickness) / 2;
    let result65 =
      (cottage.roofPanelLength - cottage.roofHalfDepth / Math.cos(cottage.roofPitch)) / 2;
    let result66 = Math.sin(cottage.roofPitch) * result65;
    let result67 = -result58 * Math.cos(cottage.roofPitch) * result65;
    cottage.builder.add(
      `shingle`,
      createBeveledPropBox(
        cottage.width + 2 * cottage.gableOverhang,
        cottage.roofThickness,
        cottage.roofPanelLength,
        0.08,
      ),
      {
        y: result63 + result66,
        z: result64 + result67,
        rx: result58 * cottage.roofPitch,
        tint: cottage.roofColor,
        jitter: 0.02,
        uv: {
          grain: 0,
          flipV: result58 > 0,
          ou: 0,
          ov: 0.13,
        },
        noAO: true,
        colorFn: createHeightGradientColorizer([
          [cottage.eaveY - 0.8, 0.82],
          [cottage.eaveY + 0.3, 1],
        ]),
      },
    );
    for (let result68 of [-1, 1]) {
      cottage.builder.add(
        `paint`,
        createBeveledPropBox(0.12, 0.34, cottage.roofPanelLength, 0.04),
        {
          x: result68 * (cottage.width / 2 + cottage.gableOverhang + 0.02),
          y: result63 + result66 - result61 * 0.1,
          z: result64 + result67 - result58 * result62 * 0.1,
          rx: result58 * cottage.roofPitch,
          tint: cottage.trimColor,
          noAO: true,
        },
      );
    }
    cottage.builder.add(
      `paint`,
      createBeveledPropBox(cottage.width + 2 * cottage.gableOverhang + 0.06, 0.24, 0.1, 0.035),
      {
        y: cottage.eaveY - cottage.eaveOverhang * cottage.roofSlope - 0.02,
        z: result58 * (cottage.roofHalfDepth + 0.03),
        tint: cottage.trimColor,
        noAO: true,
      },
    );
    for (let index = 0; index <= 6; index++) {
      cottage.builder.add(`wood`, createBeveledPropBox(0.14, 0.16, 0.8200000000000001, 0.03), {
        x: -cottage.width / 2 + (index * cottage.width) / 6,
        y: cottage.eaveY - (cottage.eaveOverhang / 2) * cottage.roofSlope - 0.1,
        z: result58 * (cottage.depth / 2 + cottage.eaveOverhang / 2 - 0.05),
        rx: result58 * cottage.roofPitch,
        tint: cottage.timberColor,
        noAO: true,
      });
    }
  }
  cottage.builder.add(
    `shingle`,
    createBeveledPropBox(cottage.width + 2 * cottage.gableOverhang + 0.14, 0.3, 0.52, 0.12),
    {
      y: cottage.ridgeY - 0.04,
      tint: shadeBuildingColor(cottage.roofColor, 0.72),
      noAO: true,
      uv: {
        grain: 0,
      },
    },
  );
  for (let result69 of [-1, 1]) {
    cottage.builder.add(`plain`, new THREE.SphereGeometry(0.13, 10, 8), {
      x: result69 * (cottage.width / 2 + cottage.gableOverhang + 0.1),
      y: cottage.ridgeY + 0.02,
      tint: shadeBuildingColor(cottage.roofColor, 0.7),
      noAO: true,
    });
  }
}
