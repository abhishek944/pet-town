/** Surface-conforming eyes, highlights, mouths, blush and expression rigs. */
import * as THREE from "three";
import { mergeCreatureGeometries } from "../geometry/merge-creature-geometries.js";
import { projectCreaturePointOntoEllipsoid } from "../geometry/project-creature-point-onto-ellipsoid.js";
export function createCreatureEyeHighlightsGeometry(
  mapValue,
  value,
  value2,
  value3,
  value4 = 1.015,
) {
  let values = [value * value4, value2 * value4, value3 * (value4 + 0.045)];
  return mergeCreatureGeometries(
    mapValue.map((position2) => {
      let circleGeometry = new THREE.CircleGeometry(1, 20);
      circleGeometry.deleteAttribute(`uv`);
      let position3 = circleGeometry.attributes.position;
      for (let index = 0; index < position3.count; index++) {
        let projectCreaturePointOntoEllipsoidResult = projectCreaturePointOntoEllipsoid(
          new THREE.Vector3(
            position2.x * value + position3.getX(index) * position2.sx * value,
            position2.y * value2 + position3.getY(index) * position2.sy * value2,
            value3,
          ),
          values,
        );
        position3.setXYZ(
          index,
          projectCreaturePointOntoEllipsoidResult.x,
          projectCreaturePointOntoEllipsoidResult.y,
          projectCreaturePointOntoEllipsoidResult.z,
        );
      }
      circleGeometry.computeVertexNormals();
      return circleGeometry;
    }),
  );
}
