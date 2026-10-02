/** Cupped petals, flower rings, bent stems and flower variants with levels of detail. */
import * as THREE from "three";
import { foliageColorToRgb } from "../geometry-helpers/foliage-color-to-rgb.js";
import { vegetationState } from "../state.js";
import { mixFoliageRgb } from "../geometry-helpers/mix-foliage-rgb.js";
import { createRadialPetalRing } from "./create-radial-petal-ring.js";
import { shadeFlowerPetals } from "./shade-flower-petals.js";
import { orientFlowerPart } from "./orient-flower-part.js";
import { createNoisyFlowerCenter } from "./create-noisy-flower-center.js";
import { bakeFoliageVertexAttributes } from "../geometry-helpers/bake-foliage-vertex-attributes.js";
import { multiplyFoliageRgb } from "../geometry-helpers/multiply-foliage-rgb.js";
import { clampFoliageUnit } from "../geometry-helpers/clamp-foliage-unit.js";
export function buildRoundFlowerHead(flower) {
  let result8 = flower.kind === `daisy`;
  if (flower.lod === 0) {
    let result9 = result8
      ? createRadialPetalRing(
          10,
          0.082,
          0.024,
          0.018,
          0.14,
          {
            cupL: 0.18,
            cupW: 0.35,
            curl: 0.1,
            widths: [0.4, 1],
            ss: [0, 0.55],
          },
          flower.detailRandom,
        )
      : createRadialPetalRing(
          6,
          0.07,
          0.042,
          0.01,
          0.32,
          {
            cupL: 0.32,
            cupW: 0.4,
            curl: 0.12,
            widths: [0.42, 1, 0.82],
            ss: [0, 0.5, 0.86],
          },
          flower.detailRandom,
        );
    for (let result11 of shadeFlowerPetals(result9, result8 ? 0.8 : 0.66, flower.headSway)) {
      orientFlowerPart(
        result11,
        flower.headX,
        flower.headY,
        flower.headZ,
        flower.tiltX,
        flower.tiltZ,
        flower.rotationY,
      );
      flower.parts.push(result11);
    }
    let result10 = result8 ? 0.03 : 0.018;
    let foliageColorToRgbResult3 = foliageColorToRgb(result8 ? `#ffc63a` : `#fff1a8`);
    let noisyFlowerCenterResult = createNoisyFlowerCenter(
      result10,
      0.6,
      Math.floor(flower.detailRandom() * 999),
      6,
      3,
    );
    noisyFlowerCenterResult.translate(0, result10 * 0.25, 0);
    orientFlowerPart(
      noisyFlowerCenterResult,
      flower.headX,
      flower.headY,
      flower.headZ,
      flower.tiltX,
      flower.tiltZ,
      flower.rotationY,
    );
    flower.parts.push(
      bakeFoliageVertexAttributes(noisyFlowerCenterResult, (value4, yValue) => ({
        c: mixFoliageRgb(
          multiplyFoliageRgb(foliageColorToRgbResult3, 0.62),
          foliageColorToRgbResult3,
          clampFoliageUnit(yValue.y * 0.6 + 0.45),
        ),
        s: flower.headSway,
        t: 0,
      })),
    );
  } else {
    let circleGeometry = new THREE.CircleGeometry(result8 ? 0.1 : 0.08, result8 ? 8 : 6);
    circleGeometry.rotateX(-Math.PI / 2);
    orientFlowerPart(
      circleGeometry,
      flower.headX,
      flower.headY,
      flower.headZ,
      flower.tiltX,
      flower.tiltZ,
      flower.rotationY,
    );
    flower.parts.push(
      bakeFoliageVertexAttributes(circleGeometry, (position2) => ({
        c: multiplyFoliageRgb(
          [1, 1, 1],
          0.8 +
            0.2 *
              clampFoliageUnit(
                Math.hypot(position2.x - flower.headX, position2.z - flower.headZ) / 0.08,
              ),
        ),
        s: flower.headSway,
        t: 1,
        n: vegetationState.foliageUpAxis,
      })),
    );
    let circleGeometry2 = new THREE.CircleGeometry(result8 ? 0.032 : 0.02, 5);
    circleGeometry2.rotateX(-Math.PI / 2);
    circleGeometry2.translate(0, 0.006, 0);
    orientFlowerPart(
      circleGeometry2,
      flower.headX,
      flower.headY,
      flower.headZ,
      flower.tiltX,
      flower.tiltZ,
      flower.rotationY,
    );
    flower.parts.push(
      bakeFoliageVertexAttributes(circleGeometry2, () => ({
        c: foliageColorToRgb(result8 ? `#ffc63a` : `#fff1a8`),
        s: flower.headSway,
        t: 0,
        n: vegetationState.foliageUpAxis,
      })),
    );
  }
}
