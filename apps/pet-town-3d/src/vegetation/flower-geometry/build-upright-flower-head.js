/** Cupped petals, flower rings, bent stems and flower variants with levels of detail. */
import * as THREE from "three";
import { orientFlowerPart } from "./orient-flower-part.js";
import { bakeFoliageVertexAttributes } from "../geometry-helpers/bake-foliage-vertex-attributes.js";
import { multiplyFoliageRgb } from "../geometry-helpers/multiply-foliage-rgb.js";
import { clampFoliageUnit } from "../geometry-helpers/clamp-foliage-unit.js";
import { foliageSmoothstep } from "../geometry-helpers/foliage-smoothstep.js";
import { smoothLatheSeamNormals } from "../geometry-helpers/smooth-lathe-seam-normals.js";
import { createFoliageEllipsoid } from "../geometry-helpers/create-foliage-ellipsoid.js";
export function buildUprightFlowerHead(flower) {
  if (flower.kind === `tulip`) {
    let result12 = flower.lod === 0 ? 12 : 6;
    let values4 =
      flower.lod === 0
        ? [
            [0.001, 0],
            [0.03, 0.012],
            [0.05, 0.045],
            [0.056, 0.085],
            [0.046, 0.115],
          ]
        : [
            [0.001, 0],
            [0.05, 0.04],
            [0.048, 0.11],
          ];
    let latheGeometry = new THREE.LatheGeometry(
      values4.map(([value5, value6]) => new THREE.Vector2(value5, value6)),
      result12,
    );
    let position3 = latheGeometry.attributes.position;
    for (let index2 = 0; index2 < position3.count; index2++) {
      let xResult = position3.getX(index2);
      let yResult = position3.getY(index2);
      let zResult = position3.getZ(index2);
      let atan2Result = Math.atan2(zResult, xResult);
      let foliageSmoothstepResult = foliageSmoothstep(0.07, 0.115, yResult);
      position3.setY(index2, yResult + foliageSmoothstepResult * 0.02 * Math.cos(atan2Result * 3));
      let result13 =
        1 - foliageSmoothstepResult * 0.1 * (0.5 + 0.5 * Math.cos(atan2Result * 3 + Math.PI));
      position3.setX(index2, xResult * result13);
      position3.setZ(index2, zResult * result13);
    }
    latheGeometry.computeVertexNormals();
    smoothLatheSeamNormals(latheGeometry, result12, values4.length);
    orientFlowerPart(
      latheGeometry,
      flower.headX,
      flower.headY - 0.01,
      flower.headZ,
      flower.tiltX * 0.4,
      flower.tiltZ * 0.4,
      flower.rotationY,
    );
    flower.parts.push(
      bakeFoliageVertexAttributes(latheGeometry, (yValue2) => ({
        c: multiplyFoliageRgb(
          [1, 1, 1],
          0.62 + 0.38 * clampFoliageUnit((yValue2.y - flower.headY + 0.01) / 0.12),
        ),
        s: flower.headSway,
        t: 1,
      })),
    );
  } else if (flower.kind === `puff`) {
    let result14 =
      flower.lod === 0
        ? [
            [0.024, 0.02, 0, 0.024],
            [-0.012, 0.02, 0.021, 0.024],
            [-0.012, 0.02, -0.021, 0.024],
            [0, 0.045, 0, 0.026],
          ]
        : [[0, 0.035, 0, 0.04]];
    for (let [result15, result16, result17, result18] of result14) {
      let result19 =
        flower.lod === 0
          ? createFoliageEllipsoid(result18, 5, 4)
          : new THREE.OctahedronGeometry(result18, 0);
      result19.translate(result15, result16, result17);
      orientFlowerPart(
        result19,
        flower.headX,
        flower.headY,
        flower.headZ,
        flower.tiltX * 0.5,
        flower.tiltZ * 0.5,
        flower.rotationY,
      );
      flower.parts.push(
        bakeFoliageVertexAttributes(result19, (value7, yValue3) => ({
          c: multiplyFoliageRgb([1, 1, 1], 0.62 + 0.38 * clampFoliageUnit(yValue3.y * 0.5 + 0.5)),
          s: flower.headSway,
          t: 1,
        })),
      );
    }
  } else if (flower.kind === `lavender`) {
    let result20 = flower.lod === 0 ? 6 : 4;
    let result21 = flower.lod === 0 ? 9 : 3;
    let values5 = [];
    for (let index3 = 0; index3 <= result21; index3++) {
      let result22 = index3 / result21;
      values5.push(
        new THREE.Vector2(
          index3 === 0 || index3 === result21
            ? 0.002
            : 0.024 * (1 - result22 * 0.55) * (flower.lod === 0 ? 0.8 + (index3 % 2) * 0.2 : 1),
          result22 * 0.22,
        ),
      );
    }
    let latheGeometry2 = new THREE.LatheGeometry(values5, result20);
    latheGeometry2.translate(0, -0.17, 0);
    latheGeometry2.translate(flower.headX, flower.headY, flower.headZ);
    flower.parts.push(
      bakeFoliageVertexAttributes(latheGeometry2, (yValue4, yValue5) => ({
        c: multiplyFoliageRgb(
          [1, 1, 1],
          0.66 +
            0.34 * clampFoliageUnit(yValue5.y * 0.5 + 0.5) * 0.6 +
            0.2 * clampFoliageUnit((yValue4.y - flower.headY + 0.2) / 0.22),
        ),
        s: yValue4.y,
        t: 1,
      })),
    );
  }
}
