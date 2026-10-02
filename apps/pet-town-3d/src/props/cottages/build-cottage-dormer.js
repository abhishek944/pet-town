/** Cottage variants, porch and stair layout, cottage geometry and hanging baskets. */
import * as THREE from "three";
import { createBeveledPropBox } from "../geometry/create-beveled-prop-box.js";
import { createSubdividedPropBox } from "../geometry/create-subdivided-prop-box.js";
import { createBuildingWallColorizer } from "../building-details/create-building-wall-colorizer.js";
import { appendGabledRoofGeometry } from "../building-details/append-gabled-roof-geometry.js";
import { extrudePropShape } from "../geometry/extrude-prop-shape.js";
import { appendCottageWindowGeometry } from "../building-details/append-cottage-window-geometry.js";
export function buildCottageDormer(cottage) {
  if (cottage.settings.dormer) {
    let result70 = cottage.settings.dormerX ?? 0;
    let result71 = cottage.depth / 2 - 0.3;
    let result72 = 1.4;
    let result73 = cottage.eaveY + 0.25;
    let result74 = cottage.eaveY + 1.45;
    let result75 = 1.7;
    cottage.builder.add(
      cottage.wallMaterial,
      createSubdividedPropBox(result72, result74 - result73, result75, 0.3),
      {
        x: result70,
        y: (result73 + result74) / 2,
        z: result71 - result75 / 2,
        tint: cottage.wallColor,
        colorFn: createBuildingWallColorizer(
          result72,
          result75,
          result73,
          result74,
          cottage.wallNoiseSeed + 3,
        ),
        uv: cottage.wallUvs,
      },
    );
    for (let result76 of [-1, 1]) {
      cottage.builder.add(`paint`, createBeveledPropBox(0.16, result74 - result73, 0.16, 0.03), {
        x: result70 + (result76 * result72) / 2,
        y: (result73 + result74) / 2,
        z: result71,
        tint: cottage.trimColor,
        uv: {
          grain: 1,
        },
      });
    }
    let appendGabledRoofGeometryResult = appendGabledRoofGeometry(cottage.builder, {
      cx: result70,
      yB: result74,
      cw: result72,
      z0: result71 - result75 - 0.2,
      z1: result71 + 0.28,
      tint: cottage.roofColor,
      trim: cottage.trimColor,
      pitch: 0.75,
      th: 0.2,
      over: 0.18,
    });
    let shape = new THREE.Shape();
    shape.moveTo(-1.4 / 2, 0);
    shape.lineTo(result72 / 2, 0);
    shape.lineTo(0, appendGabledRoofGeometryResult.apex - result74);
    shape.closePath();
    cottage.builder.add(cottage.wallMaterial, extrudePropShape(shape, 0.12, 0), {
      x: result70,
      y: result74,
      z: result71 + 0.02,
      tint: cottage.wallColor,
      uv: cottage.wallUvs,
    });
    cottage.builder.push(result70, (result73 + result74) / 2 + 0.12, result71 + 0.02);
    appendCottageWindowGeometry(cottage.builder, cottage.random, {
      w: 0.7,
      h: 0.72,
      trim: cottage.trimColor,
      header: false,
      sill: cottage.trimColor,
    });
    cottage.builder.pop();
    cottage.metadata.windows.push({
      x: result70,
      y: (result73 + result74) / 2,
      z: result71 + 0.3,
      nx: 0,
      nz: 1,
      high: true,
    });
  }
}
