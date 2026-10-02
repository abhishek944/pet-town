/** Beveled primitives, gables, lathes, extruded arches and noisy rocks. */
import * as THREE from "three";
import { mergeVertices } from "three/addons/utils/BufferGeometryUtils.js";
import { propFractalNoise3d } from "../math/prop-fractal-noise3d.js";
export function createNoisyPropRock(
  value = 1,
  value2 = 2,
  value3 = 0.2,
  value4 = 1.6,
  value5 = 0,
  value6 = 1,
) {
  let icosahedronGeometry = new THREE.IcosahedronGeometry(value, value2);
  icosahedronGeometry.deleteAttribute(`normal`);
  icosahedronGeometry.deleteAttribute(`uv`);
  icosahedronGeometry = mergeVertices(icosahedronGeometry);
  let position2 = icosahedronGeometry.attributes.position;
  for (let index = 0; index < position2.count; index++) {
    let xResult = position2.getX(index);
    let yResult = position2.getY(index);
    let zResult = position2.getZ(index);
    let result =
      1 +
      (propFractalNoise3d(
        xResult * value4 + value5 * 7.1,
        yResult * value4 + value5 * 3.3,
        zResult * value4 - value5 * 5.7,
        3,
      ) -
        0.5) *
        value3 *
        2;
    position2.setXYZ(index, xResult * result, yResult * result * value6, zResult * result);
  }
  icosahedronGeometry.computeVertexNormals();
  return icosahedronGeometry;
}
