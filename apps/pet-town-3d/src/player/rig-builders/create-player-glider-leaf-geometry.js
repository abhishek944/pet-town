/** Cached primitive meshes, rig groups, glider leaf and blob-shadow texture generation. */
import * as THREE from "three";
import { playerState } from "../state.js";
export function createPlayerGliderLeafGeometry(value = 1.25, value2 = 1.5) {
  let planeGeometry = new THREE.PlaneGeometry(1, 1, 28, 36);
  let position2 = planeGeometry.attributes.position;
  let color = new THREE.Color(playerState.playerPalette.leaf);
  let color2 = new THREE.Color(playerState.playerPalette.leafDeep);
  let color3 = new THREE.Color(playerState.playerPalette.vein);
  let values = [];
  for (let index = 0; index < position2.count; index++) {
    let xResult = position2.getX(index);
    let result = position2.getY(index) + 0.5;
    let result2 = Math.sin(Math.PI * result ** 0.85) ** 0.9 * 0.5 * value;
    let result3 = xResult * 2 * result2;
    let result4 = (result - 0.42) * value2;
    let result5 =
      result3 * result3 * -0.55 -
      result4 * result4 * 0.22 +
      0.05 * Math.sin(xResult * 14) * Math.abs(xResult) * 2 * result2;
    position2.setXYZ(index, result3, result5, result4);
    let result6 = Math.abs(xResult) * 2;
    let result7 = Math.exp(-((result6 / 0.05) ** 2));
    let result8 =
      Math.max(0, Math.cos((result * 7 - result6 * 2.2) * Math.PI)) ** 24 *
      (result6 > 0.06 && result6 < 0.9) *
      0.7;
    let lerpResult = color
      .clone()
      .lerp(color2, result6 ** 1.6 * 0.8 + (1 - result) * 0.1)
      .lerp(color3, Math.min(1, result7 + result8));
    values.push(lerpResult.r, lerpResult.g, lerpResult.b);
  }
  planeGeometry.setAttribute(`color`, new THREE.Float32BufferAttribute(values, 3));
  planeGeometry.computeVertexNormals();
  return planeGeometry;
}
