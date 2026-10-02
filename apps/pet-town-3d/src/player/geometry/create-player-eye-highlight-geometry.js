/** Procedural ellipsoids, iris highlights, tubes, straps, decals, stitched patches and surface projection. */
import * as THREE from "three";
import { mergePlayerGeometries } from "./merge-player-geometries.js";
import { projectPlayerPointOntoEllipsoid } from "./project-player-point-onto-ellipsoid.js";
export function createPlayerEyeHighlightGeometry(value, value2, value3) {
  let values = [
    {
      x: -0.34,
      y: 0.4,
      sx: 0.36,
      sy: 0.4,
    },
    {
      x: 0.36,
      y: -0.38,
      sx: 0.16,
      sy: 0.16,
    },
    {
      x: 0.1,
      y: 0.56,
      sx: 0.09,
      sy: 0.09,
    },
  ];
  let values2 = [value * 1.015, value2 * 1.015, value3 * 1.08];
  return mergePlayerGeometries(
    values.map((position2) => {
      let circleGeometry = new THREE.CircleGeometry(1, 20);
      circleGeometry.deleteAttribute(`uv`);
      let position3 = circleGeometry.attributes.position;
      let vector = new THREE.Vector3();
      for (let index = 0; index < position3.count; index++) {
        vector.set(
          position2.x * value + position3.getX(index) * position2.sx * value,
          position2.y * value2 + position3.getY(index) * position2.sy * value2,
          value3,
        );
        projectPlayerPointOntoEllipsoid(vector, values2, vector);
        position3.setXYZ(index, vector.x, vector.y, vector.z);
      }
      circleGeometry.computeVertexNormals();
      return circleGeometry;
    }),
  );
}
