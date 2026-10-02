/** Bushes, ferns, saplings, clover, mushrooms, reeds and fallen logs. */
import * as THREE from "three";
import { vegetationState } from "../state.js";
import { intersectCanopySurface } from "../canopy-geometry/intersect-canopy-surface.js";
import { clampFoliageUnit } from "../geometry-helpers/clamp-foliage-unit.js";
import { foliageColorToRgb } from "../geometry-helpers/foliage-color-to-rgb.js";
import { createRadialPetalRing } from "../flower-geometry/create-radial-petal-ring.js";
import { shadeFlowerPetals } from "../flower-geometry/shade-flower-petals.js";
import { createNoisyFlowerCenter } from "../flower-geometry/create-noisy-flower-center.js";
import { bakeFoliageVertexAttributes } from "../geometry-helpers/bake-foliage-vertex-attributes.js";
import { mixFoliageRgb } from "../geometry-helpers/mix-foliage-rgb.js";
import { multiplyFoliageRgb } from "../geometry-helpers/multiply-foliage-rgb.js";
import { createFoliageEllipsoid } from "../geometry-helpers/create-foliage-ellipsoid.js";
export function decorateBushCanopy(bush) {
  if (bush.settings.berries || bush.settings.blooms) {
    let result7 = bush.settings.berryCount ?? 10;
    let sliceResult = bush.parts.slice();
    for (let index3 = 0; index3 < result7; index3++) {
      let result8 =
        (index3 / result7) * vegetationState.foliageFullTurn * 2.3 + bush.random() * 0.8;
      let result9 = bush.random() * 1.1 - 0.15;
      let intersectCanopySurfaceResult = intersectCanopySurface(
        sliceResult,
        bush.center,
        new THREE.Vector3(Math.cos(result8), result9, Math.sin(result8)).normalize(),
      );
      if (!intersectCanopySurfaceResult || intersectCanopySurfaceResult.p.y < 0.2) {
        continue;
      }
      let n2 = intersectCanopySurfaceResult.n;
      let result10 =
        0.35 *
        (0.55 +
          0.45 *
            clampFoliageUnit(
              (intersectCanopySurfaceResult.p.y - bush.center.y + bush.radius) / (2 * bush.radius),
            ));
      if (bush.settings.blooms) {
        let addScaledVectorResult = intersectCanopySurfaceResult.p
          .clone()
          .addScaledVector(n2, 0.05);
        let normalizeResult = n2.clone().add(vegetationState.foliageUpAxis).normalize();
        let result11 = index3 % 3 == 0 ? foliageColorToRgb(`#fff8f2`) : bush.settings.blooms;
        let radialPetalRingResult = createRadialPetalRing(
          5,
          0.088,
          0.058,
          0.008,
          0.4,
          {
            cupL: 0.35,
            cupW: 0.3,
            curl: 0.06,
            widths: [0.46, 1, 0.85],
            ss: [0, 0.5, 0.86],
          },
          bush.random,
        );
        let setFromUnitVectorsResult = new THREE.Quaternion().setFromUnitVectors(
          vegetationState.foliageUpAxis,
          normalizeResult,
        );
        for (let result12 of shadeFlowerPetals(radialPetalRingResult, 0.8, result10, 0)) {
          let color2 = result12.attributes.color;
          for (let index4 = 0; index4 < color2.count; index4++) {
            color2.setXYZ(
              index4,
              color2.getX(index4) * result11[0],
              color2.getY(index4) * result11[1],
              color2.getZ(index4) * result11[2],
            );
          }
          let fromResult = Array.from(result12.index.array);
          let length2 = fromResult.length;
          for (let index5 = 0; index5 < length2; index5 += 3) {
            fromResult.push(fromResult[index5], fromResult[index5 + 2], fromResult[index5 + 1]);
          }
          result12.setIndex(fromResult);
          result12.applyQuaternion(setFromUnitVectorsResult);
          result12.translate(
            addScaledVectorResult.x,
            addScaledVectorResult.y,
            addScaledVectorResult.z,
          );
          bush.parts.push(result12);
        }
        let noisyFlowerCenterResult = createNoisyFlowerCenter(0.018, 0.7, index3 + 3, 6, 3);
        noisyFlowerCenterResult.applyQuaternion(setFromUnitVectorsResult);
        noisyFlowerCenterResult.translate(
          addScaledVectorResult.x + normalizeResult.x * 0.008,
          addScaledVectorResult.y + normalizeResult.y * 0.008,
          addScaledVectorResult.z + normalizeResult.z * 0.008,
        );
        bush.parts.push(
          bakeFoliageVertexAttributes(noisyFlowerCenterResult, () => ({
            c: foliageColorToRgb(`#ffcf40`),
            s: result10,
            t: 0,
          })),
        );
      } else {
        let addScaledVectorResult2 = intersectCanopySurfaceResult.p
          .clone()
          .addScaledVector(n2, 0.02);
        let berries2 = bush.settings.berries;
        let mixFoliageRgbResult = mixFoliageRgb(berries2, [1, 1, 1], 0.5);
        let multiplyFoliageRgbResult = multiplyFoliageRgb(berries2, 0.55);
        let result13 = bush.settings.berrySize ?? 0.07;
        let normalizeResult2 = new THREE.Vector3(-n2.z, 0, n2.x).normalize();
        for (let index6 = 0; index6 < 3; index6++) {
          let addScaledVectorResult3 = normalizeResult2
            .clone()
            .multiplyScalar((index6 - 1) * result13 * 1.5)
            .add(new THREE.Vector3(0, index6 === 1 ? -result13 * 1.1 : 0, 0))
            .addScaledVector(n2, result13 * 0.6);
          let foliageEllipsoidResult = createFoliageEllipsoid(
            result13 * (index6 === 1 ? 1.1 : 0.95),
            7,
            5,
          );
          foliageEllipsoidResult.translate(
            addScaledVectorResult2.x + addScaledVectorResult3.x,
            addScaledVectorResult2.y + addScaledVectorResult3.y,
            addScaledVectorResult2.z + addScaledVectorResult3.z,
          );
          let bakeFoliageVertexAttributesResult = bakeFoliageVertexAttributes(
            foliageEllipsoidResult,
            (value2, yValue) => ({
              c: mixFoliageRgb(
                multiplyFoliageRgbResult,
                mixFoliageRgbResult,
                clampFoliageUnit(yValue.y * 0.6 + 0.5),
              ),
              s: result10,
              t: 0,
            }),
          );
          bush.parts.push(bakeFoliageVertexAttributesResult);
          if (index6 === 1) {
            bush.lodParts.push(bakeFoliageVertexAttributesResult);
          }
        }
      }
    }
  }
}
