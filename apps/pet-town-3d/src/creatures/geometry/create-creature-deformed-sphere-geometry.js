/** Reusable procedural creature geometry, vertex colors, ellipsoid projection and transforms. */
import { createCreatureWeldedSphereGeometry } from "./create-creature-welded-sphere-geometry.js";
import { creaturesState } from "../state.js";
export function createCreatureDeformedSphereGeometry(value, value2 = 24, value3 = 16) {
  let creatureWeldedSphereGeometryResult = createCreatureWeldedSphereGeometry(value2, value3);
  let position2 = creatureWeldedSphereGeometryResult.attributes.position;
  let count2 = position2.count;
  let floatBuffer = new Float32Array(count2 * 3);
  let floatBuffer2 = new Float32Array(count2);
  for (let index = 0; index < count2; index++) {
    let xResult = position2.getX(index);
    let yResult = position2.getY(index);
    let zResult = position2.getZ(index);
    floatBuffer[index * 3] = xResult;
    floatBuffer[index * 3 + 1] = yResult;
    floatBuffer[index * 3 + 2] = zResult;
    let result = (yResult + 1) / 2;
    floatBuffer2[index] = result;
    value(
      creaturesState.creatureGeometryPositionScratch.set(xResult, yResult, zResult),
      xResult,
      yResult,
      zResult,
      result,
    );
    position2.setXYZ(
      index,
      creaturesState.creatureGeometryPositionScratch.x,
      creaturesState.creatureGeometryPositionScratch.y,
      creaturesState.creatureGeometryPositionScratch.z,
    );
  }
  creatureWeldedSphereGeometryResult.computeVertexNormals();
  creatureWeldedSphereGeometryResult.userData.unit = floatBuffer;
  creatureWeldedSphereGeometryResult.userData.t = floatBuffer2;
  return creatureWeldedSphereGeometryResult;
}
