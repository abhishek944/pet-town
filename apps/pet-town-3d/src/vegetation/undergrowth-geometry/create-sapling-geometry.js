/** Bushes, ferns, saplings, clover, mushrooms, reeds and fallen logs. */
import * as THREE from "three";
import { createBentPlantStem } from "../flower-geometry/create-bent-plant-stem.js";
import { foliageColorToRgb } from "../geometry-helpers/foliage-color-to-rgb.js";
import { vegetationState } from "../state.js";
import { createCanopyClumps } from "../canopy-geometry/create-canopy-clumps.js";
import { mergeFoliageGeometry } from "../geometry-helpers/merge-foliage-geometry.js";
export function createSaplingGeometry(value) {
  let result = 0.7 + value() * 0.35;
  let bentPlantStemResult = createBentPlantStem(
    result,
    (value() - 0.5) * 0.08,
    (value() - 0.5) * 0.08,
    foliageColorToRgb(`#5a3e28`),
    foliageColorToRgb(`#8a6a44`),
    0.035,
  );
  let aSway2 = bentPlantStemResult.attributes.aSway;
  for (let index = 0; index < aSway2.count; index++) {
    aSway2.setX(index, (aSway2.getX(index) / result) * 0.6);
  }
  let result2 = 0.34 + value() * 0.08;
  let vector = new THREE.Vector3(0, result + result2 * 0.35, 0);
  let values = [
    {
      x: 0,
      y: vector.y,
      z: 0,
      w: result2 * 1.5,
      h: result2 * 1.2,
      d: result2 * 1.5,
      ry: value() * vegetationState.foliageFullTurn,
    },
  ];
  for (let index2 = 0; index2 < 2; index2++) {
    let result3 = value() * vegetationState.foliageFullTurn;
    values.push({
      x: Math.cos(result3) * result2 * 0.5,
      y: vector.y + (value() - 0.3) * result2 * 0.6,
      z: Math.sin(result3) * result2 * 0.5,
      w: result2,
      h: result2 * 0.85,
      d: result2,
      ry: value() * vegetationState.foliageFullTurn,
    });
  }
  let { parts: canopyClumpsResult } = createCanopyClumps(value, values, vector, result2, {
    stops: vegetationState.foliageColorRamps.sapling,
    swayBase: 0.6,
    seg: 3,
    dispAmp: 0.03,
    dispFreq: 3,
    cards: 0,
  });
  return mergeFoliageGeometry([bentPlantStemResult, ...canopyClumpsResult]);
}
