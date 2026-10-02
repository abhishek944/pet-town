/** Surface-conforming eyes, highlights, mouths, blush and expression rigs. */
import * as THREE from "three";
import { sampleCreatureFaceSurface } from "./sample-creature-face-surface.js";
import { projectCreatureFaceCurve } from "./project-creature-face-curve.js";
import { mergeCreatureTexturedGeometries } from "./merge-creature-textured-geometries.js";
export function buildCreatureBlush(materials, definition, parent, face) {
  let callback = (yawValue, value11) => {
    let values3 = [];
    for (let result20 of [-1, 1]) {
      let creatureFaceSurfaceResult2 = sampleCreatureFaceSurface(
        value11,
        result20 * yawValue.yaw,
        yawValue.pitch,
      );
      let circleGeometry = new THREE.CircleGeometry(1, 20);
      let position2 = circleGeometry.attributes.position;
      let values4 = [];
      for (let index3 = 0; index3 < position2.count; index3++) {
        values4.push([
          position2.getX(index3) * yawValue.size[0],
          position2.getY(index3) * yawValue.size[1],
        ]);
      }
      projectCreatureFaceCurve(value11, creatureFaceSurfaceResult2, values4, 0.004).forEach(
        (position3, value12) => position2.setXYZ(value12, position3.x, position3.y, position3.z),
      );
      circleGeometry.computeVertexNormals();
      values3.push(circleGeometry);
    }
    let mesh4 = new THREE.Mesh(
      mergeCreatureTexturedGeometries(values3),
      materials.blush(yawValue.color ?? 16744345),
    );
    mesh4.renderOrder = 2;
    return mesh4;
  };
  if (definition.blush) {
    let blush2 = definition.blush;
    let callbackResult = callback(blush2, blush2.surface ?? definition.surface);
    if (blush2.happyOnly) {
      let group3 = new THREE.Group();
      group3.name = `blushHappy`;
      group3.add(callbackResult);
      parent.add(group3);
      face.blushHappy = group3;
    } else {
      callbackResult.name = `blush`;
      parent.add(callbackResult);
      face.blush = callbackResult;
    }
  }
}
