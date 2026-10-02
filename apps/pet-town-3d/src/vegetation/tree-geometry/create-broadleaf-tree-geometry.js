/** Tree palettes, trunks, broadleaf crowns, fruit, pine tiers and palm fronds. */
import * as THREE from "three";
import { vegetationState } from "../state.js";
import { createCanopyClumps } from "../canopy-geometry/create-canopy-clumps.js";
import { intersectCanopySurface } from "../canopy-geometry/intersect-canopy-surface.js";
import { createTreeFruitGeometry } from "./create-tree-fruit-geometry.js";
import { foliageColorToRgb } from "../geometry-helpers/foliage-color-to-rgb.js";
import { createBranchedTreeTrunk } from "./create-branched-tree-trunk.js";
import { clampFoliageUnit } from "../geometry-helpers/clamp-foliage-unit.js";
import { mergeFoliageGeometry } from "../geometry-helpers/merge-foliage-geometry.js";
import { createSimpleTreeTrunk } from "./create-simple-tree-trunk.js";
import { scaleGeometryAroundCenter } from "./scale-geometry-around-center.js";
export function createBroadleafTreeGeometry(value, HValue = {}) {
  let result = HValue.H ?? 1.9 + value() * 1.1;
  let result2 = HValue.R ?? 1.6 + value() * 0.7;
  let result3 = HValue.stops ?? vegetationState.foliageColorRamps.oak;
  let result4 = (value() - 0.5) * result2 * 0.5;
  let result5 = (value() - 0.5) * result2 * 0.5;
  let vector = new THREE.Vector3(result4 * 0.4, result + result2 * 0.55, result5 * 0.4);
  let values = [];
  let result6 = 0.78 + value() * 0.3;
  let result7 = HValue.round ?? 0.42;
  values.push({
    x: vector.x,
    y: vector.y,
    z: vector.z,
    w: result2 * (1.3 + value() * 0.35),
    h: result2 * 1.05 * result6,
    d: result2 * (1.3 + value() * 0.35),
    ry: value() * vegetationState.foliageFullTurn,
    round: result7,
  });
  let result8 = HValue.lumps ?? 5 + Math.floor(value() * 5);
  for (let index = 0; index < result8; index++) {
    let result11 = (index / result8) * vegetationState.foliageFullTurn + (value() - 0.5) * 1.1;
    let valueResult = value();
    let result12 = result2 * (0.35 + 0.45 * (1 - valueResult) * (0.7 + value() * 0.5));
    let result13 = result2 * (0.5 + value() * 0.45) * (1 - valueResult * 0.2);
    let result14 = Math.cos(result11) * result4 + Math.sin(result11) * result5 > 0 ? 1.15 : 0.9;
    values.push({
      x: vector.x + Math.cos(result11) * result12 * result14,
      y: vector.y + result2 * (-0.35 + valueResult * 0.85) * result6,
      z: vector.z + Math.sin(result11) * result12 * result14,
      w: result13 * (0.9 + value() * 0.25),
      h: result13 * (0.72 + value() * 0.2),
      d: result13 * (0.9 + value() * 0.25),
      ry: value() * vegetationState.foliageFullTurn,
      rx: (value() - 0.5) * 0.35,
      rz: (value() - 0.5) * 0.35,
      round: result7,
    });
  }
  let result9 = Math.floor(value() * 1e6);
  let result10 = HValue.sphereBlend ?? 0.3;
  let canopyClumpsResult = createCanopyClumps(value, values, vector, result2, {
    stops: result3,
    swayBase: 1,
    cards: HValue.cards ?? 0.45,
    seg: 3,
    seed: result9,
    sphereBlend: result10,
  });
  let canopyClumpsResult2 = createCanopyClumps(value, values, vector, result2, {
    stops: result3,
    swayBase: 1,
    cards: 0,
    seg: 2,
    seed: result9,
    sphereBlend: result10,
  });
  let canopyClumpsResult3 = createCanopyClumps(value, values, vector, result2, {
    stops: result3,
    swayBase: 1,
    cards: 0,
    seg: 1,
    dispAmp: 0.05,
    seed: result9,
    sphereBlend: result10,
  });
  let parts2 = canopyClumpsResult.parts;
  let parts3 = canopyClumpsResult2.parts;
  let parts4 = canopyClumpsResult3.parts;
  if (HValue.fruit) {
    let result15 = HValue.fruitCount ?? 7;
    let sliceResult = parts2.slice();
    for (let index2 = 0; index2 < result15; index2++) {
      let result16 = (index2 / result15) * vegetationState.foliageFullTurn + value() * 0.6;
      let result17 = -0.35 + value() * 0.75;
      let normalizeResult = new THREE.Vector3(
        Math.cos(result16),
        result17,
        Math.sin(result16),
      ).normalize();
      let intersectCanopySurfaceResult = intersectCanopySurface(
        sliceResult,
        vector.clone().add(new THREE.Vector3(0, -result2 * 0.2, 0)),
        normalizeResult,
      );
      if (!intersectCanopySurfaceResult) {
        continue;
      }
      let result18 = 0.19 + value() * 0.04;
      let treeFruitGeometryResult = createTreeFruitGeometry(
        intersectCanopySurfaceResult.p
          .clone()
          .addScaledVector(intersectCanopySurfaceResult.n, result18 * 0.55),
        HValue.fruitColor ?? foliageColorToRgb(`#ff3a2e`),
        result18,
        vector,
        result2,
      );
      parts2.push(treeFruitGeometryResult);
      parts3.push(treeFruitGeometryResult);
      if (index2 % 2 == 0) {
        parts4.push(treeFruitGeometryResult);
      }
    }
  }
  let branchedTreeTrunkResult = createBranchedTreeTrunk(value, {
    H: result + result2 * 0.4,
    r0: 0.28 + result2 * 0.05,
    r1: 0.19,
    bend: 0.1 + value() * 0.12,
    topY: result + result2 * 0.4,
    color: HValue.bark ?? foliageColorToRgb(`#8a5d3b`),
    dark: foliageColorToRgb(`#4d3322`),
    R: result2,
  });
  let position2 = branchedTreeTrunkResult.attributes.position;
  for (let index3 = 0; index3 < position2.count; index3++) {
    let clampFoliageUnitResult = clampFoliageUnit(
      position2.getY(index3) / (result + result2 * 0.4),
    );
    position2.setX(
      index3,
      position2.getX(index3) + vector.x * clampFoliageUnitResult * clampFoliageUnitResult,
    );
    position2.setZ(
      index3,
      position2.getZ(index3) + vector.z * clampFoliageUnitResult * clampFoliageUnitResult,
    );
  }
  branchedTreeTrunkResult.computeBoundingSphere();
  let mergeFoliageGeometryResult = mergeFoliageGeometry(parts4);
  return {
    spheres: [
      {
        x: vector.x,
        y: vector.y + result2 * 0.05,
        z: vector.z,
        r: result2 * 1.05,
      },
    ],
    trunk: branchedTreeTrunkResult,
    trunkLite: createSimpleTreeTrunk(result + result2 * 0.4, 0.28 + result2 * 0.05, 0.19, vector),
    canopy: mergeFoliageGeometry(parts2),
    canopyLod: mergeFoliageGeometry(parts3),
    canopyLod2: mergeFoliageGeometryResult,
    canopyShadow: scaleGeometryAroundCenter(mergeFoliageGeometryResult, vector, 0.9),
    fringe: canopyClumpsResult.fringe,
    height: vector.y + result2 * 1,
    canopyRadius: result2 * 1.3,
    trunkRadius: 0.4,
    canopyCenter: vector,
  };
}
