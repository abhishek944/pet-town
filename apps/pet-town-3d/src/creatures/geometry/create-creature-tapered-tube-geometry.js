/** Reusable procedural creature geometry, vertex colors, ellipsoid projection and transforms. */
import * as THREE from "three";
import { creaturesState } from "../state.js";
import { mergeVertices, mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { createCreatureEllipsoidGeometry } from "./create-creature-ellipsoid-geometry.js";
import { normalizeCreatureGeometryAttributes } from "./normalize-creature-geometry-attributes.js";
export function createCreatureTaperedTubeGeometry(
  mapValue,
  value,
  { tSeg: value2 = 20, rSeg: value3 = 10, caps: value4 = true } = {},
) {
  let catmullRomCurve3 = new THREE.CatmullRomCurve3(
    mapValue.map((vector) => (vector.isVector3 ? vector : new THREE.Vector3(...vector))),
  );
  let tubeGeometry = new THREE.TubeGeometry(catmullRomCurve3, value2, 1, value3, false);
  let position2 = tubeGeometry.attributes.position;
  let floatBuffer = new Float32Array(position2.count);
  for (let index = 0; index < position2.count; index++) {
    let result = Math.floor(index / (value3 + 1)) / value2;
    catmullRomCurve3.getPointAt(result, creaturesState.creatureTubeCenterScratch);
    creaturesState.creatureGeometryPositionScratch
      .fromBufferAttribute(position2, index)
      .sub(creaturesState.creatureTubeCenterScratch)
      .multiplyScalar(typeof value == `function` ? value(result) : value)
      .add(creaturesState.creatureTubeCenterScratch);
    position2.setXYZ(
      index,
      creaturesState.creatureGeometryPositionScratch.x,
      creaturesState.creatureGeometryPositionScratch.y,
      creaturesState.creatureGeometryPositionScratch.z,
    );
    floatBuffer[index] = result;
  }
  tubeGeometry.deleteAttribute(`uv`);
  tubeGeometry.deleteAttribute(`normal`);
  tubeGeometry.setAttribute(`tparam`, new THREE.BufferAttribute(floatBuffer, 1));
  tubeGeometry = mergeVertices(tubeGeometry, 1e-5);
  tubeGeometry.computeVertexNormals();
  tubeGeometry.userData.t = tubeGeometry.attributes.tparam.array.slice();
  tubeGeometry.deleteAttribute(`tparam`);
  let values = [tubeGeometry];
  if (value4) {
    let result2 = typeof value == `function` ? value(0) : value;
    let result3 = typeof value == `function` ? value(1) : value;
    let pointAtResult = catmullRomCurve3.getPointAt(0);
    let pointAtResult2 = catmullRomCurve3.getPointAt(1);
    if (result2 > 1e-4) {
      let creatureEllipsoidGeometryResult = createCreatureEllipsoidGeometry(
        result2,
        result2,
        result2,
        value3,
        Math.max(6, value3 >> 1),
      );
      creatureEllipsoidGeometryResult.userData.t = new Float32Array(
        creatureEllipsoidGeometryResult.attributes.position.count,
      ).fill(0);
      creatureEllipsoidGeometryResult.translate(pointAtResult.x, pointAtResult.y, pointAtResult.z);
      values.push(creatureEllipsoidGeometryResult);
    }
    if (result3 > 1e-4) {
      let creatureEllipsoidGeometryResult2 = createCreatureEllipsoidGeometry(
        result3,
        result3,
        result3,
        value3,
        Math.max(6, value3 >> 1),
      );
      creatureEllipsoidGeometryResult2.userData.t = new Float32Array(
        creatureEllipsoidGeometryResult2.attributes.position.count,
      ).fill(1);
      creatureEllipsoidGeometryResult2.translate(
        pointAtResult2.x,
        pointAtResult2.y,
        pointAtResult2.z,
      );
      values.push(creatureEllipsoidGeometryResult2);
    }
  }
  if (values.length === 1) {
    return tubeGeometry;
  }
  let values2 = [];
  for (let result4 of values) {
    values2.push(...result4.userData.t);
  }
  let mergeGeometriesResult = mergeGeometries(values.map(normalizeCreatureGeometryAttributes));
  mergeGeometriesResult.userData.t = new Float32Array(values2);
  return mergeGeometriesResult;
}
