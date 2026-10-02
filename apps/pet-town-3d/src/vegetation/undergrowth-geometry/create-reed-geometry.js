/** Bushes, ferns, saplings, clover, mushrooms, reeds and fallen logs. */
import * as THREE from "three";
import { createGrassBladeBuffers } from "../grass-geometry/create-grass-blade-buffers.js";
import { foliageColorToRgb } from "../geometry-helpers/foliage-color-to-rgb.js";
import { vegetationState } from "../state.js";
import { appendFoldedGrassBlade } from "../grass-geometry/append-folded-grass-blade.js";
import { mixFoliageRgb } from "../geometry-helpers/mix-foliage-rgb.js";
import { finalizeGrassBladeGeometry } from "../grass-geometry/finalize-grass-blade-geometry.js";
import { createBentPlantStem } from "../flower-geometry/create-bent-plant-stem.js";
import { bakeFoliageVertexAttributes } from "../geometry-helpers/bake-foliage-vertex-attributes.js";
import { clampFoliageUnit } from "../geometry-helpers/clamp-foliage-unit.js";
import { mergeFoliageGeometry } from "../geometry-helpers/merge-foliage-geometry.js";
export function createReedGeometry(value) {
  let grassBladeBuffersResult = createGrassBladeBuffers();
  let foliageColorToRgbResult = foliageColorToRgb(`#35723a`);
  let foliageColorToRgbResult2 = foliageColorToRgb(`#5aa048`);
  let foliageColorToRgbResult3 = foliageColorToRgb(`#a9cf72`);
  for (let index = 0; index < 10; index++) {
    let result2 = value() * vegetationState.foliageFullTurn;
    let result3 = 0.2 * Math.sqrt(value());
    appendFoldedGrassBlade(grassBladeBuffersResult, {
      ox: Math.cos(result2) * result3,
      oz: Math.sin(result2) * result3,
      dir: result2 + (value() - 0.5),
      h: 0.8 + value() * 0.7,
      w: 0.05 + value() * 0.03,
      lean: 0.2 + value() * 0.25,
      segs: 3,
      fold: 0.5,
      upBase: 0.5,
      upTip: 0.2,
      colAt: (value2) =>
        value2 < 0.45
          ? mixFoliageRgb(foliageColorToRgbResult, foliageColorToRgbResult2, value2 / 0.45)
          : mixFoliageRgb(
              foliageColorToRgbResult2,
              foliageColorToRgbResult3,
              (value2 - 0.45) / 0.55,
            ),
    });
  }
  let values = [finalizeGrassBladeGeometry(grassBladeBuffersResult, 0)];
  let result = 1 + Math.floor(value() * 3);
  for (let index2 = 0; index2 < result; index2++) {
    let result4 = value() * vegetationState.foliageFullTurn;
    let result5 = value() * 0.15;
    let result6 = Math.cos(result4) * result5;
    let result7 = Math.sin(result4) * result5;
    let result8 = 1.2 + value() * 0.5;
    let result9 = (value() - 0.5) * 0.15;
    let result10 = (value() - 0.5) * 0.15;
    let bentPlantStemResult = createBentPlantStem(
      result8,
      result9,
      result10,
      foliageColorToRgb(`#3c6e2e`),
      foliageColorToRgb(`#7ea851`),
      0.016,
    );
    bentPlantStemResult.translate(result6, 0, result7);
    values.push(bentPlantStemResult);
    let capsuleGeometry = new THREE.CapsuleGeometry(0.05, 0.22, 3, 8);
    capsuleGeometry.translate(result6 + result9 * 0.8, result8 - 0.2, result7 + result10 * 0.8);
    values.push(
      bakeFoliageVertexAttributes(capsuleGeometry, (yValue, position) => ({
        c: mixFoliageRgb(
          foliageColorToRgb(`#4a2c18`),
          foliageColorToRgb(`#8a5530`),
          clampFoliageUnit(position.y * 0.3 + 0.5 + (position.x + position.z) * 0.15),
        ),
        s: yValue.y,
        t: 0,
      })),
    );
    let cylinderGeometry = new THREE.CylinderGeometry(0.006, 0.01, 0.14, 4);
    cylinderGeometry.translate(result6 + result9, result8 + 0.02, result7 + result10);
    values.push(
      bakeFoliageVertexAttributes(cylinderGeometry, (yValue2) => ({
        c: foliageColorToRgb(`#9a8a5a`),
        s: yValue2.y,
        t: 0,
      })),
    );
  }
  return mergeFoliageGeometry(values);
}
