/** Tree palettes, trunks, broadleaf crowns, fruit, pine tiers and palm fronds. */
import * as THREE from "three";
import { mixFoliageRgb } from "../geometry-helpers/mix-foliage-rgb.js";
import { foliageSmoothstep } from "../geometry-helpers/foliage-smoothstep.js";
import { vegetationState } from "../state.js";
import { multiplyFoliageRgb } from "../geometry-helpers/multiply-foliage-rgb.js";
import { createFoliageBufferGeometry } from "../geometry-helpers/create-foliage-buffer-geometry.js";
import { bakeFoliageVertexAttributes } from "../geometry-helpers/bake-foliage-vertex-attributes.js";
import { createFoliageDetailRandom } from "../undergrowth-geometry/create-foliage-detail-random.js";
export function buildPalmFronds(palm) {
  for (let index6 = 0; index6 < palm.frondCount; index6++) {
    let result20 =
      (index6 / palm.frondCount) * vegetationState.foliageFullTurn + palm.random() * 0.4;
    let result21 = 2.3 + palm.random() * 0.7;
    let result22 = 0.4 + palm.random() * 0.25;
    let result23 = 1 + palm.random() * 0.3;
    let vector = new THREE.Vector3(Math.cos(result20), 0, Math.sin(result20));
    let vector2 = new THREE.Vector3(-vector.z, 0, vector.x);
    let callback = (value6) =>
      palm.crownCenter
        .clone()
        .addScaledVector(vector, result21 * value6 + 0.1)
        .add(
          new THREE.Vector3(
            0,
            result21 * (result22 * value6 - result23 * value6 * value6) + 0.1,
            0,
          ),
        );
    let values9 = [];
    let values10 = [];
    let values11 = [];
    let values12 = [];
    let values13 = [];
    let callback2 = (position3, position4, value7, value8) => {
      values9.push(position3.x, position3.y, position3.z);
      values10.push(position4.x, position4.y, position4.z);
      values12.push(...value7);
      values13.push(value8);
      return values9.length / 3 - 1;
    };
    let normalizeResult = new THREE.Vector3(0, 1, 0).addScaledVector(vector, 0.3).normalize();
    for (let index7 = 0; index7 <= 10; index7++) {
      let result25 = index7 / 10;
      let callbackResult = callback(result25);
      let result26 = 0.045 * (1 - result25 * 0.7);
      let mixFoliageRgbResult = mixFoliageRgb(palm.leafLight, palm.leafTip, result25);
      if (
        (callback2(
          callbackResult.clone().addScaledVector(vector2, -result26),
          normalizeResult,
          mixFoliageRgbResult,
          1.4 + result25 * 1.6,
        ),
        callback2(
          callbackResult.clone().addScaledVector(vector2, result26),
          normalizeResult,
          mixFoliageRgbResult,
          1.4 + result25 * 1.6,
        ),
        index7 < 10)
      ) {
        let result27 = index7 * 2;
        values11.push(result27, result27 + 1, result27 + 3, result27, result27 + 3, result27 + 2);
      }
    }
    let result24 = palm.settings.leaflets ?? 13;
    let foliageDetailRandomResult = createFoliageDetailRandom(Math.floor(palm.random() * 1e9));
    for (let index8 = 0; index8 < result24; index8++) {
      let result28 = 0.1 + (index8 / result24) * 0.86;
      let result29 = Math.min(1, result28 + 1.69 / result24);
      let result30 =
        (0.35 + 0.55 * Math.sin(Math.PI * Math.min(1, result28 * 1.05))) *
        (0.9 + foliageDetailRandomResult() * 0.2);
      let callbackResult2 = callback(result28);
      let callbackResult3 = callback(result28 + 0.04);
      let callbackResult4 = callback(result29);
      for (let result31 of [-1, 1]) {
        let multiplyScalarResult = vector2.clone().multiplyScalar(result31);
        let result32 = callbackResult4
          .clone()
          .addScaledVector(multiplyScalarResult, result30)
          .add(new THREE.Vector3(0, -result30 * (0.35 + 0.35 * result28), 0));
        let result33 = callbackResult2
          .clone()
          .lerp(result32, 0.45)
          .add(new THREE.Vector3(0, result30 * 0.08, 0));
        let multiplyScalarResult2 = new THREE.Vector3()
          .subVectors(callbackResult3, callbackResult2)
          .multiplyScalar(0.9);
        let normalizeResult2 = normalizeResult
          .clone()
          .addScaledVector(multiplyScalarResult, 0.25)
          .normalize();
        let result34 = 0.72 + 0.28 * foliageSmoothstep(0, 0.3, result28);
        let multiplyFoliageRgbResult = multiplyFoliageRgb(
          mixFoliageRgb(palm.leafDark, palm.leafMid, 0.5),
          result34,
        );
        let multiplyFoliageRgbResult2 = multiplyFoliageRgb(palm.leafMid, result34);
        let multiplyFoliageRgbResult3 = multiplyFoliageRgb(
          mixFoliageRgb(palm.leafMid, palm.leafTip, 0.5 + 0.5 * result28),
          result34,
        );
        let result35 = 1.4 + result28 * 1.6;
        let result36 = 1.4 + result29 * 1.6 + 0.2;
        let callback2Result = callback2(
          callbackResult2,
          normalizeResult2,
          multiplyFoliageRgbResult,
          result35,
        );
        let callback2Result2 = callback2(
          callbackResult3,
          normalizeResult2,
          multiplyFoliageRgbResult,
          result35,
        );
        let callback2Result3 = callback2(
          result33,
          normalizeResult2,
          multiplyFoliageRgbResult2,
          (result35 + result36) / 2,
        );
        let callback2Result4 = callback2(
          result33.clone().add(multiplyScalarResult2),
          normalizeResult2,
          multiplyFoliageRgbResult2,
          (result35 + result36) / 2,
        );
        let callback2Result5 = callback2(
          result32,
          normalizeResult2,
          multiplyFoliageRgbResult3,
          result36,
        );
        values11.push(
          callback2Result,
          callback2Result2,
          callback2Result4,
          callback2Result,
          callback2Result4,
          callback2Result3,
          callback2Result3,
          callback2Result4,
          callback2Result5,
        );
      }
    }
    let foliageBufferGeometryResult2 = createFoliageBufferGeometry(
      values9,
      values10,
      null,
      values11,
    );
    palm.crownParts.push(
      bakeFoliageVertexAttributes(foliageBufferGeometryResult2, (value9, value10, value11) => ({
        c: values12.slice(value11 * 3, value11 * 3 + 3),
        s: values13[value11],
        t: 1,
      })),
    );
  }
}
