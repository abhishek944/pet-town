/** Jellop translucent mochi geometry, internal heart, leaf wrap and gummy ears. */
import * as THREE from "three";
import { createCreatureExtrudedShapeGeometry } from "../../rig-builders/create-creature-extruded-shape-geometry.js";
export function createJellopHeartGeometry(value) {
  let shape = new THREE.Shape();
  shape.moveTo(0, -0.95);
  shape.bezierCurveTo(-0.3, -0.62, -1, -0.22, -1, 0.3);
  shape.bezierCurveTo(-1, 0.82, -0.42, 1.08, 0, 0.62);
  shape.bezierCurveTo(0.42, 1.08, 1, 0.82, 1, 0.3);
  shape.bezierCurveTo(1, -0.22, 0.3, -0.62, 0, -0.95);
  let creatureExtrudedShapeGeometryResult = createCreatureExtrudedShapeGeometry(shape, {
    depth: 0.35,
    bevelEnabled: true,
    bevelThickness: 0.35,
    bevelSize: 0.28,
    bevelSegments: 5,
    curveSegments: 18,
    steps: 1,
  });
  creatureExtrudedShapeGeometryResult.center();
  creatureExtrudedShapeGeometryResult.scale(value, value, value);
  return creatureExtrudedShapeGeometryResult;
}
