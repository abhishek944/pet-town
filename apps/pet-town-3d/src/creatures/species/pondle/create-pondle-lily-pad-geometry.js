/** Pondle frog geometry, lily-pad collar, feet and eyes. */
import * as THREE from "three";
import { creaturesState } from "../../state.js";
import { createCreatureExtrudedShapeGeometry } from "../../rig-builders/create-creature-extruded-shape-geometry.js";
export function createPondleLilyPadGeometry(value, value2, value3, value4 = 0.55) {
  let shape = new THREE.Shape();
  let result = value3 / 2;
  let result2 = creaturesState.creatureRigTau - value3 / 2;
  shape.absarc(0, 0, value, result, result2, false);
  shape.lineTo(Math.cos(result2 - 0.02) * value2, Math.sin(result2 - 0.02) * value2);
  shape.absarc(0, 0, value2, result2 - 0.02, result + 0.02, true);
  shape.closePath();
  let creatureExtrudedShapeGeometryResult = createCreatureExtrudedShapeGeometry(shape, {
    depth: 0.012,
    bevelEnabled: true,
    bevelThickness: 0.008,
    bevelSize: 0.008,
    bevelSegments: 2,
    curveSegments: 40,
    steps: 1,
  });
  creatureExtrudedShapeGeometryResult.rotateX(-Math.PI / 2);
  let position2 = creatureExtrudedShapeGeometryResult.attributes.position;
  for (let index = 0; index < position2.count; index++) {
    let xResult = position2.getX(index);
    let zResult = position2.getZ(index);
    let hypotResult = Math.hypot(xResult, zResult);
    position2.setY(index, position2.getY(index) - value4 * Math.max(0, hypotResult - value2) ** 2);
  }
  creatureExtrudedShapeGeometryResult.computeVertexNormals();
  return creatureExtrudedShapeGeometryResult;
}
