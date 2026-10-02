/** Bushes, ferns, saplings, clover, mushrooms, reeds and fallen logs. */
import * as THREE from "three";
import { vegetationState } from "../state.js";
import { bakeFoliageVertexAttributes } from "../geometry-helpers/bake-foliage-vertex-attributes.js";
import { mixFoliageRgb } from "../geometry-helpers/mix-foliage-rgb.js";
import { foliageColorToRgb } from "../geometry-helpers/foliage-color-to-rgb.js";
import { clampFoliageUnit } from "../geometry-helpers/clamp-foliage-unit.js";
import { multiplyFoliageRgb } from "../geometry-helpers/multiply-foliage-rgb.js";
import { createFoliageEllipsoid } from "../geometry-helpers/create-foliage-ellipsoid.js";
import { mergeFoliageGeometry } from "../geometry-helpers/merge-foliage-geometry.js";
export function createMushroomGeometry(value, countValue = {}) {
  let result = countValue.count ?? 1 + Math.floor(value() * 3);
  let result2 = countValue.spots ?? true;
  let values = [];
  for (let index = 0; index < result; index++) {
    let result3 = index === 0 ? 1 : 0.55 + value() * 0.3;
    let result4 = value() * vegetationState.foliageFullTurn;
    let result5 = index === 0 ? 0 : 0.14 + value() * 0.08;
    let result6 = Math.cos(result4) * result5;
    let result7 = Math.sin(result4) * result5;
    let result8 = (countValue.tall ? 1.6 : 1) * result3;
    let latheGeometry = new THREE.LatheGeometry(
      [
        [0, 0],
        [0.065, 0],
        [0.06, 0.06],
        [0.05, 0.14],
        [0.055, 0.2],
        [0.001, 0.2],
      ].map(([value2, value3]) => new THREE.Vector2(value2 * result3, value3 * result8)),
      8,
    );
    let result9 = (value() - 0.5) * 0.3;
    latheGeometry.rotateZ(result9);
    latheGeometry.translate(result6, 0, result7);
    values.push(
      bakeFoliageVertexAttributes(latheGeometry, (yValue) => ({
        c: mixFoliageRgb(
          foliageColorToRgb(`#d9c9a8`),
          foliageColorToRgb(`#fff8ea`),
          clampFoliageUnit(yValue.y / (0.2 * result8)),
        ),
        s: 0,
        t: 0,
      })),
    );
    let result10 = (countValue.capR ?? 0.2) * result3;
    let result11 = 0.19 * result8;
    let latheGeometry2 = new THREE.LatheGeometry(
      [
        [0.001, 0.14],
        [0.35, 0.13],
        [0.65, 0.1],
        [0.88, 0.055],
        [1, 0],
        [0.96, -0.03],
        [0.6, -0.01],
        [0.2, -0.01],
        [0.001, 0],
      ].map(
        ([value4, value5]) =>
          new THREE.Vector2(value4 * result10, value5 * result10 * (countValue.flat ? 1.3 : 2.2)),
      ),
      14,
    );
    if (
      (latheGeometry2.translate(0, result11, 0),
      latheGeometry2.rotateZ(result9),
      latheGeometry2.translate(result6, 0, result7),
      values.push(
        bakeFoliageVertexAttributes(latheGeometry2, (value6, yValue2) =>
          yValue2.y < -0.3
            ? {
                c: foliageColorToRgb(`#ead7b8`),
                s: 0,
                t: 0,
              }
            : {
                c: multiplyFoliageRgb([1, 1, 1], 0.7 + 0.3 * clampFoliageUnit(yValue2.y)),
                s: 0,
                t: 1,
              },
        ),
      ),
      result2)
    ) {
      let result12 = 5 + Math.floor(value() * 3);
      for (let index2 = 0; index2 < result12; index2++) {
        let result13 = (index2 / result12) * vegetationState.foliageFullTurn + value() * 0.5;
        let result14 = 0.3 + value() * 0.45;
        let result15 = Math.cos(result13) * result14 * result10;
        let result16 = Math.sin(result13) * result14 * result10;
        let result17 =
          result11 +
          result10 * (countValue.flat ? 1.3 : 2.2) * 0.14 * (1 - result14 * result14) * 0.98;
        let foliageEllipsoidResult = createFoliageEllipsoid(
          result10 * (0.13 + value() * 0.06),
          6,
          4,
          0.35,
        );
        let normalizeResult = new THREE.Vector3(result15, result10 * 0.8, result16).normalize();
        foliageEllipsoidResult.applyQuaternion(
          new THREE.Quaternion().setFromUnitVectors(vegetationState.foliageUpAxis, normalizeResult),
        );
        foliageEllipsoidResult.translate(result15, result17, result16);
        foliageEllipsoidResult.rotateZ(result9);
        foliageEllipsoidResult.translate(result6, 0, result7);
        values.push(
          bakeFoliageVertexAttributes(foliageEllipsoidResult, () => ({
            c: foliageColorToRgb(`#fffaf0`),
            s: 0,
            t: 0,
          })),
        );
      }
    }
  }
  return mergeFoliageGeometry(values);
}
