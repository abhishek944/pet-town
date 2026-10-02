/** Tree palettes, trunks, broadleaf crowns, fruit, pine tiers and palm fronds. */
import * as THREE from "three";
import { foliageColorToRgb } from "../geometry-helpers/foliage-color-to-rgb.js";
import { mixFoliageRgb } from "../geometry-helpers/mix-foliage-rgb.js";
import { foliageSmoothstep } from "../geometry-helpers/foliage-smoothstep.js";
import { vegetationState } from "../state.js";
import { multiplyFoliageRgb } from "../geometry-helpers/multiply-foliage-rgb.js";
import { createFoliageBufferGeometry } from "../geometry-helpers/create-foliage-buffer-geometry.js";
import { bakeFoliageVertexAttributes } from "../geometry-helpers/bake-foliage-vertex-attributes.js";
export function buildPalmTrunk(palm) {
  palm.height = palm.settings.H ?? 4.2 + palm.random() * 1.4;
  palm.bend = 0.9 + palm.random() * 0.8;
  palm.sideLean = (palm.random() - 0.5) * 0.6;
  palm.trunkPoints = [];
  for (let index = 0; index <= 8; index++) {
    let result6 = index / 8;
    palm.trunkPoints.push(
      new THREE.Vector3(
        palm.bend * result6 * result6 + palm.sideLean * Math.sin(result6 * Math.PI),
        palm.height * result6,
        palm.sideLean * 0.5 * Math.sin(result6 * Math.PI * 0.8),
      ),
    );
  }
  palm.trunkCurve = new THREE.CatmullRomCurve3(palm.trunkPoints);
  palm.trunkPositions = [];
  palm.trunkNormals = [];
  palm.trunkIndices = [];
  palm.trunkColors = [];
  palm.trunkSway = [];
  palm.trunkUvs = [];
  palm.barkLight = foliageColorToRgb(`#dcbd8e`);
  palm.barkMid = foliageColorToRgb(`#c29a68`);
  palm.barkDark = foliageColorToRgb(`#8e6a44`);
  palm.trunkFrames = palm.trunkCurve.computeFrenetFrames(33, false);
  for (let index2 = 0; index2 <= 33; index2++) {
    let result7 = index2 / 33;
    let result8 = Math.min(10, Math.floor(result7 * 11));
    let result9 = result7 * 11 - result8;
    let result10 =
      (0.27 - 0.09 * result7) * (1 + 0.16 * (1 - result9) ** 1.6) * (index2 === 0 ? 1.12 : 1);
    let pointAtResult2 = palm.trunkCurve.getPointAt(result7);
    let position = palm.trunkFrames.normals[index2];
    let position2 = palm.trunkFrames.binormals[index2];
    let result11 =
      result9 < 0.2
        ? mixFoliageRgb(palm.barkDark, palm.barkMid, result9 / 0.2)
        : mixFoliageRgb(palm.barkMid, palm.barkLight, foliageSmoothstep(0.2, 0.9, result9));
    for (let index3 = 0; index3 <= 8; index3++) {
      let result12 = (index3 / 8) * vegetationState.foliageFullTurn;
      let result13 = Math.cos(result12);
      let result14 = Math.sin(result12);
      let result15 = position.x * result13 + position2.x * result14;
      let result16 = position.y * result13 + position2.y * result14;
      let result17 = position.z * result13 + position2.z * result14;
      palm.trunkPositions.push(
        pointAtResult2.x + result15 * result10,
        pointAtResult2.y + result16 * result10,
        pointAtResult2.z + result17 * result10,
      );
      palm.trunkNormals.push(result15, result16 - 0.25 * (1 - result9) * 0 + 0, result17);
      palm.trunkColors.push(
        ...multiplyFoliageRgb(result11, 0.8 + 0.2 * foliageSmoothstep(0, 0.25, result7)),
      );
      palm.trunkSway.push(result7 * result7 * 1.4);
      palm.trunkUvs.push((index3 / 8) * 2, result7 * palm.height * 0.5);
    }
  }
  for (let index4 = 0; index4 < 33; index4++) {
    for (let index5 = 0; index5 < 8; index5++) {
      let result18 = index4 * 9 + index5;
      let result19 = result18 + 8 + 1;
      palm.trunkIndices.push(
        result18,
        result19,
        result18 + 1,
        result18 + 1,
        result19,
        result19 + 1,
      );
    }
  }
  palm.trunkGeometry = createFoliageBufferGeometry(
    palm.trunkPositions,
    palm.trunkNormals,
    palm.trunkUvs,
    palm.trunkIndices,
  );
  palm.trunkGeometry.computeVertexNormals();
  palm.trunk = bakeFoliageVertexAttributes(palm.trunkGeometry, (value2, value3, value4) => ({
    c: palm.trunkColors.slice(value4 * 3, value4 * 3 + 3),
    s: palm.trunkSway[value4],
    t: 1,
  }));
}
