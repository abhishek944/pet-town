/** Canopy surface intersections, rounded clumps and silhouette fringe cards. */
import * as THREE from "three";
import { multiplyFoliageRgb } from "../geometry-helpers/multiply-foliage-rgb.js";
import { vegetationState } from "../state.js";
export function buildCanopyFringeGeometry(canopy) {
  canopy.fringe = null;
  if (canopy.cardDensity > 0 && canopy.fringeAnchors.length) {
    let values5 = [];
    let values6 = [];
    let values7 = [];
    let values8 = [];
    let values9 = [];
    let values10 = [];
    let values11 = [];
    let values12 = [];
    for (let result29 of canopy.fringeAnchors) {
      let result30 =
        canopy.cardSize[0] + (canopy.cardSize[1] - canopy.cardSize[0]) * canopy.random();
      let result31 = canopy.random() * vegetationState.foliageFullTurn;
      let result32 = Math.cos(result31);
      let result33 = Math.sin(result31);
      let addScaledVectorResult = result29.p.clone().addScaledVector(result29.n, 0.04);
      let callback4Result = canopy.shadeVertex(addScaledVectorResult, result29.n, 0);
      let result34 = 0.76 + canopy.random() * 0.22;
      let multiplyFoliageRgbResult = multiplyFoliageRgb(callback4Result.c, result34);
      let result35 = Math.floor(canopy.random() * 4);
      let result36 = (result35 % 2) * 0.5;
      let result37 = Math.floor(result35 / 2) * 0.5;
      let result38 = values5.length / 3;
      for (let [result39, result40] of [
        [-1, -1],
        [1, -1],
        [1, 1],
        [-1, 1],
      ]) {
        values5.push(addScaledVectorResult.x, addScaledVectorResult.y, addScaledVectorResult.z);
        values6.push(callback4Result.n.x, callback4Result.n.y, callback4Result.n.z);
        values7.push(result36 + (result39 + 1) / 4, result37 + (result40 + 1) / 4);
        values8.push(...multiplyFoliageRgbResult);
        values9.push(callback4Result.s);
        values10.push(1);
        values11.push(
          result39 * result32 - result40 * result33,
          result39 * result33 + result40 * result32,
          result30,
        );
      }
      values12.push(result38, result38 + 1, result38 + 2, result38, result38 + 2, result38 + 3);
    }
    canopy.fringe = new THREE.BufferGeometry();
    canopy.fringe.setAttribute(`position`, new THREE.Float32BufferAttribute(values5, 3));
    canopy.fringe.setAttribute(`normal`, new THREE.Float32BufferAttribute(values6, 3));
    canopy.fringe.setAttribute(`uv`, new THREE.Float32BufferAttribute(values7, 2));
    canopy.fringe.setAttribute(`color`, new THREE.Float32BufferAttribute(values8, 3));
    canopy.fringe.setAttribute(`aSway`, new THREE.Float32BufferAttribute(values9, 1));
    canopy.fringe.setAttribute(`aTint`, new THREE.Float32BufferAttribute(values10, 1));
    canopy.fringe.setAttribute(`aCard`, new THREE.Float32BufferAttribute(values11, 3));
    canopy.fringe.setIndex(values12);
    canopy.fringe.computeBoundingSphere();
    canopy.fringe.boundingSphere.radius += canopy.cardSize[1] * 1.5;
  }
}
