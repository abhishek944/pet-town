/** Canopy surface intersections, rounded clumps and silhouette fringe cards. */
import * as THREE from "three";
import { foliageSmoothstep } from "../geometry-helpers/foliage-smoothstep.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { mergeVertices } from "three/addons/utils/BufferGeometryUtils.js";
import { bakeFoliageVertexAttributes } from "../geometry-helpers/bake-foliage-vertex-attributes.js";
export function buildCanopyClumpSurfaces(canopy) {
  canopy.parts = [];
  canopy.fringeAnchors = [];
  canopy.position = new THREE.Vector3();
  canopy.normal = new THREE.Vector3();
  canopy.gradient = new THREE.Vector3();
  canopy.normalSampleStep = 0.06;
  for (let index3 = 0; index3 < canopy.clumps.length; index3++) {
    let result19 = canopy.clumps[index3];
    let roundedBoxGeometry = new RoundedBoxGeometry(
      result19.w,
      result19.h,
      result19.d,
      canopy.segments,
      canopy.roundingRadii[index3],
    );
    roundedBoxGeometry.applyMatrix4(canopy.transforms[index3]);
    if (!roundedBoxGeometry.index) {
      roundedBoxGeometry.setIndex(
        Array.from(
          {
            length: roundedBoxGeometry.attributes.position.count,
          },
          (value11, value12) => value12,
        ),
      );
    }
    let position3 = roundedBoxGeometry.attributes.position;
    let normal2 = roundedBoxGeometry.attributes.normal;
    let count2 = position3.count;
    let byteBuffer = new Uint8Array(count2);
    let floatBuffer = new Float32Array(count2);
    let result20 =
      canopy.displacement *
      Math.min(1.3, 0.55 + 0.45 * Math.min(result19.w, result19.h, result19.d));
    for (let index4 = 0; index4 < count2; index4++) {
      canopy.position.fromBufferAttribute(position3, index4);
      canopy.normal.fromBufferAttribute(normal2, index4);
      let result23 =
        canopy.clumps.length > 1 ? canopy.neighborClumpDistance(index3, canopy.position) : 1e9;
      byteBuffer[index4] = +(result23 < -0.04);
      floatBuffer[index4] = result23 >= -0.04 ? 1 - foliageSmoothstep(0, 0.35, result23) : 0;
      let callback3Result = canopy.noiseAt(canopy.position.x, canopy.position.y, canopy.position.z);
      canopy.gradient
        .set(
          canopy.noiseAt(
            canopy.position.x + canopy.normalSampleStep,
            canopy.position.y,
            canopy.position.z,
          ) -
            canopy.noiseAt(
              canopy.position.x - canopy.normalSampleStep,
              canopy.position.y,
              canopy.position.z,
            ),
          canopy.noiseAt(
            canopy.position.x,
            canopy.position.y + canopy.normalSampleStep,
            canopy.position.z,
          ) -
            canopy.noiseAt(
              canopy.position.x,
              canopy.position.y - canopy.normalSampleStep,
              canopy.position.z,
            ),
          canopy.noiseAt(
            canopy.position.x,
            canopy.position.y,
            canopy.position.z + canopy.normalSampleStep,
          ) -
            canopy.noiseAt(
              canopy.position.x,
              canopy.position.y,
              canopy.position.z - canopy.normalSampleStep,
            ),
        )
        .multiplyScalar(1 / (2 * canopy.normalSampleStep));
      canopy.gradient.addScaledVector(canopy.normal, -canopy.gradient.dot(canopy.normal));
      let result24 = result20 * 2;
      position3.setXYZ(
        index4,
        canopy.position.x + canopy.normal.x * (callback3Result - 0.5) * result24,
        canopy.position.y + canopy.normal.y * (callback3Result - 0.5) * result24,
        canopy.position.z + canopy.normal.z * (callback3Result - 0.5) * result24,
      );
      canopy.normal.addScaledVector(canopy.gradient, -result24).normalize();
      normal2.setXYZ(index4, canopy.normal.x, canopy.normal.y, canopy.normal.z);
    }
    let array2 = roundedBoxGeometry.index.array;
    let values4 = [];
    for (let index5 = 0; index5 < array2.length; index5 += 3) {
      let result25 = array2[index5];
      let result26 = array2[index5 + 1];
      let result27 = array2[index5 + 2];
      if (!(byteBuffer[result25] && byteBuffer[result26] && byteBuffer[result27])) {
        values4.push(result25, result26, result27);
      }
    }
    roundedBoxGeometry.setIndex(values4);
    let result21 =
      2 * (result19.w * result19.h + result19.w * result19.d + result19.h * result19.d);
    let result22 = Math.round(result21 * canopy.cardDensity);
    for (let index6 = 0, index7 = 0; index6 < result22 && index7 < result22 * 8; index7++) {
      let result28 = Math.floor(canopy.random() * count2);
      if (!(byteBuffer[result28] || floatBuffer[result28] > 0.5)) {
        canopy.position.fromBufferAttribute(position3, result28);
        canopy.normal.fromBufferAttribute(normal2, result28);
        if (!(canopy.normal.y < -0.5)) {
          canopy.fringeAnchors.push({
            p: canopy.position.clone(),
            n: canopy.normal.clone(),
          });
          index6++;
        }
      }
    }
    canopy.parts.push(
      mergeVertices(
        bakeFoliageVertexAttributes(roundedBoxGeometry, (value13, value14, value15) =>
          canopy.shadeVertex(value13, value14, floatBuffer[value15]),
        ),
        1e-4,
      ),
    );
  }
}
