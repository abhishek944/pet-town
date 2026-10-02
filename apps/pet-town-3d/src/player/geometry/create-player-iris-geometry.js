/** Procedural ellipsoids, iris highlights, tubes, straps, decals, stitched patches and surface projection. */
import * as THREE from "three";
import { createPlayerEllipsoidGeometry } from "./create-player-ellipsoid-geometry.js";
import { colorPlayerGeometryVertices } from "./color-player-geometry-vertices.js";
import { playerMaterialSmoothstep } from "../materials/player-material-smoothstep.js";
export function createPlayerIrisGeometry(value, value2, value3, value4, value5) {
  let playerEllipsoidGeometryResult = createPlayerEllipsoidGeometry(value, value2, value3, 24, 18);
  let color = new THREE.Color(value4);
  let color2 = new THREE.Color(value5);
  let lerpResult = new THREE.Color(value4).lerp(new THREE.Color(16777215), 0.4);
  let color3 = new THREE.Color(1182228);
  return colorPlayerGeometryVertices(
    playerEllipsoidGeometryResult,
    (copyValue, position, zValue) => {
      let result = (position.y / value2 + 1) / 2;
      copyValue.copy(color).lerp(color2, playerMaterialSmoothstep(0.2, 0.82, result));
      let result2 =
        playerMaterialSmoothstep(0.36, 0.1, result) * playerMaterialSmoothstep(0.2, 0.8, zValue.z);
      copyValue.lerp(lerpResult, result2 * 0.85);
      let hypotResult = Math.hypot(position.x / (value * 0.42), (position.y / value2 - 0.08) / 0.5);
      copyValue.lerp(
        color3,
        playerMaterialSmoothstep(1, 0.6, hypotResult) *
          0.75 *
          playerMaterialSmoothstep(0, 0.5, zValue.z),
      );
    },
  );
}
