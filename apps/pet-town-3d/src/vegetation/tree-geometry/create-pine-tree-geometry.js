/** Tree palettes, trunks, broadleaf crowns, fruit, pine tiers and palm fronds. */
import * as THREE from "three";
import { vegetationState } from "../state.js";
import { createFoliageDetailRandom } from "../undergrowth-geometry/create-foliage-detail-random.js";
import { smoothLatheSeamNormals } from "../geometry-helpers/smooth-lathe-seam-normals.js";
import { bakeFoliageVertexAttributes } from "../geometry-helpers/bake-foliage-vertex-attributes.js";
import { sampleFoliageColorRamp } from "../geometry-helpers/sample-foliage-color-ramp.js";
import { foliageSmoothstep } from "../geometry-helpers/foliage-smoothstep.js";
import { multiplyFoliageRgb } from "../geometry-helpers/multiply-foliage-rgb.js";
import { mixFoliageRgb } from "../geometry-helpers/mix-foliage-rgb.js";
import { foliageColorToRgb } from "../geometry-helpers/foliage-color-to-rgb.js";
import { clampFoliageUnit } from "../geometry-helpers/clamp-foliage-unit.js";
import { createFoliageFringeCards } from "../canopy-geometry/create-foliage-fringe-cards.js";
import { createBranchedTreeTrunk } from "./create-branched-tree-trunk.js";
import { createSimpleTreeTrunk } from "./create-simple-tree-trunk.js";
import { mergeFoliageGeometry } from "../geometry-helpers/merge-foliage-geometry.js";
export function createPineTreeGeometry(value, tiersValue = {}) {
  let result = tiersValue.tiers ?? 3 + Math.floor(value() * 4);
  let result2 = tiersValue.slender ?? 0.75 + value() * 0.5;
  let result3 = (tiersValue.R ?? 1.45 + value() * 0.6) * result2;
  let result4 = 0.8 + value() * 0.7;
  let result5 = (1.15 + value() * 0.4) * (1.1 - (result2 - 1) * 0.4);
  let result6 = 0.5 + value() * 0.22;
  let result7 = tiersValue.stops ?? vegetationState.foliageColorRamps.pine;
  let result8 = (value() - 0.5) * 0.35;
  let result9 = (value() - 0.5) * 0.35;
  let result10 = !!tiersValue.snow;
  let values = [];
  let values2 = [];
  let result4Value = result4;
  let result11 = null;
  let result12 = result4 + result * result5 * 0.72 + result5 * 0.5;
  for (let index = 0; index < result; index++) {
    let result14 = index / Math.max(1, result - 1);
    let result15 = result3 * (1 - result6 * result14) * (0.8 + value() * 0.4);
    let result16 = result5 * (1 - 0.2 * result14) * (0.88 + value() * 0.24);
    let reverseResult = [
      new THREE.Vector2(0.001, result16),
      new THREE.Vector2(result15 * 0.28, result16 * 0.78),
      new THREE.Vector2(result15 * 0.72, result16 * 0.3),
      new THREE.Vector2(result15 * 0.97, result16 * 0.06),
      new THREE.Vector2(result15, -result16 * 0.02),
      new THREE.Vector2(result15 * 0.9, -result16 * 0.22),
      new THREE.Vector2(result15 * 0.55, -result16 * 0.12),
      new THREE.Vector2(0.001, result16 * 0.05),
    ].reverse();
    if (index === 0) {
      result11 = {
        y0: result4Value - result16 * 0.22 - 0.32,
        y1: result4Value + result16 * 0.55,
        r: result15,
      };
    }
    let valueResult = value();
    let result17 = value() * vegetationState.foliageFullTurn;
    let foliageDetailRandomResult = createFoliageDetailRandom(Math.floor(value() * 1e9));
    let result18 = tiersValue.lodSegs ?? 18 + Math.floor(valueResult * 5);
    let length2 = reverseResult.length;
    let latheGeometry = new THREE.LatheGeometry(reverseResult, result18, result17);
    let position2 = latheGeometry.attributes.position;
    let fromResult = Array.from(
      {
        length: result18 + 1,
      },
      () => 0.8 + foliageDetailRandomResult() * 0.4,
    );
    fromResult[result18] = fromResult[0];
    for (let index2 = 0; index2 < position2.count; index2++) {
      let xResult = position2.getX(index2);
      let zResult = position2.getZ(index2);
      let yResult = position2.getY(index2);
      let hypotResult = Math.hypot(xResult, zResult);
      let result21 = Math.floor(index2 / length2);
      if (hypotResult > result15 * 0.55) {
        let result22 =
          (Math.cos(Math.atan2(zResult, xResult) * 7) * 0.5 + 0.5) * fromResult[result21];
        position2.setY(index2, yResult - result22 * 0.32 * (hypotResult / result15));
        let result23 = 1 + (result22 - 0.5) * 0.1 + (fromResult[result21] - 1) * 0.08;
        position2.setX(index2, xResult * result23);
        position2.setZ(index2, zResult * result23);
      }
    }
    latheGeometry.computeVertexNormals();
    smoothLatheSeamNormals(latheGeometry, result18, length2);
    let uv2 = latheGeometry.attributes.uv;
    let result19 = Math.max(2, Math.round((vegetationState.foliageFullTurn * result15) / 0.9));
    for (let index3 = 0; index3 < uv2.count; index3++) {
      uv2.setXY(index3, uv2.getX(index3) * result19, uv2.getY(index3) * 1.8);
    }
    latheGeometry.rotateX((value() - 0.5) * 0.28);
    latheGeometry.rotateZ((value() - 0.5) * 0.28);
    latheGeometry.translate(
      result8 * (result4Value - result4) * 0.25 + (value() - 0.5) * 0.12,
      result4Value,
      result9 * (result4Value - result4) * 0.25 + (value() - 0.5) * 0.12,
    );
    let result4ValueValue = result4Value;
    let result20 = result4Value + result16 * 0.35;
    let bakeFoliageVertexAttributesResult = bakeFoliageVertexAttributes(
      latheGeometry,
      (position3, yValue) => {
        let result24 = (position3.y - result4) / (result12 - result4);
        let foliageColorRampResult = sampleFoliageColorRamp(
          result7,
          0.15 + result24 * 0.7 + ((position3.y - result4ValueValue) / result16) * 0.3,
        );
        let result25 = Math.hypot(position3.x, position3.z) / result15;
        let result26 = yValue.y < -0.2 ? 0.8 : 1;
        let result27 = (0.76 + 0.24 * foliageSmoothstep(0.2, 1, result25)) * result26;
        foliageColorRampResult = multiplyFoliageRgb(foliageColorRampResult, result27);
        if (result10 && yValue.y > 0.35 && position3.y > result4ValueValue + result16 * 0.05) {
          foliageColorRampResult = mixFoliageRgb(
            foliageColorRampResult,
            foliageColorToRgb(`#f4f8ff`),
            foliageSmoothstep(0.35, 0.75, yValue.y) * 0.92,
          );
        }
        let normalizeResult = new THREE.Vector3(
          position3.x,
          position3.y - result20,
          position3.z,
        ).normalize();
        let normalizeResult2 = yValue.clone().lerp(normalizeResult, 0.3).normalize();
        return {
          c: foliageColorRampResult,
          s: 0.35 + 0.65 * clampFoliageUnit(position3.y / result12),
          t: 1,
          n: normalizeResult2,
        };
      },
    );
    if ((values.push(bakeFoliageVertexAttributesResult), !result10 && !tiersValue.lodSegs)) {
      let position4 = bakeFoliageVertexAttributesResult.attributes.position;
      let normal2 = bakeFoliageVertexAttributesResult.attributes.normal;
      let color2 = bakeFoliageVertexAttributesResult.attributes.color;
      let aSway2 = bakeFoliageVertexAttributesResult.attributes.aSway;
      let result28 = Math.round(vegetationState.foliageFullTurn * result15 * 1.6 + 3);
      for (let index4 = 0, index5 = 0; index4 < result28 && index5 < result28 * 10; index5++) {
        let result29 = Math.floor(value() * position4.count);
        let xResult2 = position4.getX(result29);
        let yResult2 = position4.getY(result29);
        let zResult2 = position4.getZ(result29);
        let hypotResult2 = Math.hypot(xResult2, zResult2);
        let yResult3 = normal2.getY(result29);
        if (yResult3 < -0.3 || hypotResult2 < result15 * 0.45) {
          continue;
        }
        let vector = new THREE.Vector3(normal2.getX(result29), yResult3, normal2.getZ(result29));
        values2.push({
          p: new THREE.Vector3(xResult2, yResult2, zResult2).addScaledVector(vector, 0.03),
          n: vector,
          c: [color2.getX(result29), color2.getY(result29), color2.getZ(result29)],
          s: aSway2.getX(result29),
          rot: Math.PI + (value() - 0.5) * 0.9,
        });
        index4++;
      }
    }
    result4Value += result16 * (0.62 + value() * 0.18);
  }
  let result13 = values2.length ? createFoliageFringeCards(values2, value, [0.22, 0.34]) : null;
  let branchedTreeTrunkResult = createBranchedTreeTrunk(value, {
    H: result4 + result5 * 1.5,
    r0: 0.3,
    r1: 0.18,
    bend: 0.03,
    branches: 0,
    topY: result4 + result5,
    color: foliageColorToRgb(`#7b5033`),
    dark: foliageColorToRgb(`#43291a`),
  });
  let values3 = [
    {
      x: 0,
      y: result4 + (result12 - result4) * 0.28,
      z: 0,
      r: result3 * 0.85,
    },
    {
      x: 0,
      y: result4 + (result12 - result4) * 0.68,
      z: 0,
      r: result3 * 0.55,
    },
  ];
  return {
    trunk: branchedTreeTrunkResult,
    trunkLite: createSimpleTreeTrunk(result4 + result5, 0.3, 0.18),
    canopy: mergeFoliageGeometry(values),
    fringe: result13,
    height: result12,
    canopyRadius: result3,
    trunkRadius: 0.38,
    canopyCenter: new THREE.Vector3(0, result4 + result5, 0),
    skirt: result11,
    spheres: values3,
  };
}
