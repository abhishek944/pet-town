/** Skinned mesh batching, per-vertex material properties and shadow proxy extraction. */
import * as THREE from "three";
import { getCreatureMaterials } from "../materials/get-creature-materials.js";
import { bakeCreatureMeshGeometry } from "./bake-creature-mesh-geometry.js";
import { creaturesState } from "../state.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
export function bakeCreatureRigMeshes(updateMatrixWorldValue) {
  let creatureMaterialsResult = getCreatureMaterials();
  updateMatrixWorldValue.updateMatrixWorld(true);
  let values = [];
  updateMatrixWorldValue.traverse((isMeshValue) => {
    if (!isMeshValue.isMesh && !isMeshValue.isSprite) {
      values.push(isMeshValue);
    }
  });
  let lookup = new Map(values.map((value, value2) => [value, value2]));
  let lookup2 = new Map();
  let values2 = [];
  updateMatrixWorldValue.traverse((isMeshValue2) => {
    if (isMeshValue2.isMesh) {
      values2.push(isMeshValue2);
    }
  });
  for (let result2 of values2) {
    let result3;
    let result4;
    let options;
    if (result2.userData.bucket === `inner`) {
      result3 = `inner`;
      result4 = creatureMaterialsResult.inner;
      options = {
        renderOrder: 4,
        castShadow: false,
      };
    } else {
      if (result2.material?.userData?.isBlush) {
        result3 = `blush:` + result2.material.uuid;
        result4 = result2.material;
        options = {
          renderOrder: 2,
          castShadow: false,
        };
      } else {
        if (result2.material === creatureMaterialsResult.jelly) {
          result3 = `jelly`;
          result4 = creatureMaterialsResult.jelly;
          options = {
            renderOrder: 3,
            castShadow: true,
          };
        } else {
          result3 = `opaque`;
          result4 = creatureMaterialsResult.uber;
          options = {
            castShadow: true,
          };
        }
      }
    }
    let result5 = result3.startsWith(`blush`) ? `blush` : result3;
    let result6 = lookup2.get(result3);
    if (!result6) {
      result6 = {
        mat: result4,
        geos: [],
        opts: options,
        bucket: result5,
      };
      lookup2.set(result3, result6);
    }
    result6.geos.push(
      bakeCreatureMeshGeometry(
        result2,
        lookup.get(result2.parent) ?? 0,
        creatureMaterialsResult,
        result5,
      ),
    );
  }
  let lookup3 = new Map();
  let vector = new THREE.Vector3();
  let matrix = new THREE.Matrix4();
  for (let mesh of values2) {
    if (mesh.userData.bucket === `inner` || mesh.material?.userData?.isBlush) {
      continue;
    }
    let parent2 = mesh.parent;
    if (!creaturesState.creatureShadowProxyBoneNames.has(parent2.name)) {
      continue;
    }
    matrix.copy(parent2.matrixWorld).invert().multiply(mesh.matrixWorld);
    let result7 = lookup3.get(parent2);
    if (!result7) {
      lookup3.set(parent2, (result7 = new THREE.Box3()));
    }
    let position2 = mesh.geometry.attributes.position;
    for (let index = 0; index < position2.count; index += 3) {
      result7.expandByPoint(vector.fromBufferAttribute(position2, index).applyMatrix4(matrix));
    }
  }
  let values3 = [];
  for (let [result8, result9] of lookup3) {
    if (result9.isEmpty()) {
      continue;
    }
    let centerResult = result9.getCenter(new THREE.Vector3());
    let multiplyScalarResult = result9.getSize(new THREE.Vector3()).multiplyScalar(0.46);
    if (!(multiplyScalarResult.x * multiplyScalarResult.y * multiplyScalarResult.z < 1e-5)) {
      values3.push({
        bone: result8.name,
        center: centerResult.toArray(),
        half: [
          Math.max(multiplyScalarResult.x, 0.02),
          Math.max(multiplyScalarResult.y, 0.02),
          Math.max(multiplyScalarResult.z, 0.02),
        ],
      });
    }
  }
  updateMatrixWorldValue.userData.proxies = values3;
  for (let result10 of values2) {
    result10.parent.remove(result10);
  }
  let result = values.map((matrixWorldValue) => matrixWorldValue.matrixWorld.clone().invert());
  let values4 = [];
  for (let [result11, result12] of lookup2) {
    let mergeGeometriesResult = mergeGeometries(result12.geos, false);
    if (!mergeGeometriesResult) {
      console.warn(`[creatures] bake merge failed for`, result11);
      continue;
    }
    mergeGeometriesResult.computeBoundingSphere();
    let skinnedMesh = new THREE.SkinnedMesh(mergeGeometriesResult, result12.mat);
    skinnedMesh.name = `baked:` + result11;
    skinnedMesh.castShadow = false;
    skinnedMesh.receiveShadow = false;
    if (result12.opts.renderOrder) {
      skinnedMesh.renderOrder = result12.opts.renderOrder;
    }
    updateMatrixWorldValue.add(skinnedMesh);
    skinnedMesh.bind(new THREE.Skeleton(values, result), new THREE.Matrix4());
    let copy2 = mergeGeometriesResult.boundingSphere.clone();
    copy2.radius *= 1.45;
    skinnedMesh.userData.bounds = [copy2.center.x, copy2.center.y, copy2.center.z, copy2.radius];
    skinnedMesh.boundingSphere = copy2.clone();
    values4.push(skinnedMesh);
  }
  return values4;
}
