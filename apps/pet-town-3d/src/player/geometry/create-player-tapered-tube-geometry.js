/** Procedural ellipsoids, iris highlights, tubes, straps, decals, stitched patches and surface projection. */
import * as THREE from "three";
export function createPlayerTaperedTubeGeometry(
  value,
  value2,
  { tSeg: value3 = 20, rSeg: value4 = 8 } = {},
) {
  let catmullRomCurve3 = new THREE.CatmullRomCurve3(value, false, `centripetal`);
  let computeFrenetFramesResult = catmullRomCurve3.computeFrenetFrames(value3, false);
  let values = [];
  let values2 = [];
  let values3 = [];
  for (let index = 0; index <= value3; index++) {
    let result = index / value3;
    let pointAtResult = catmullRomCurve3.getPointAt(result);
    let result2 = typeof value2 == `function` ? value2(result) : value2;
    let position = computeFrenetFramesResult.normals[index];
    let position2 = computeFrenetFramesResult.binormals[index];
    for (let index2 = 0; index2 <= value4; index2++) {
      let result3 = (index2 / value4) * Math.PI * 2;
      let result4 = Math.cos(result3);
      let result5 = Math.sin(result3);
      let result6 = result4 * position.x + result5 * position2.x;
      let result7 = result4 * position.y + result5 * position2.y;
      let result8 = result4 * position.z + result5 * position2.z;
      values.push(
        pointAtResult.x + result6 * result2,
        pointAtResult.y + result7 * result2,
        pointAtResult.z + result8 * result2,
      );
      values2.push(result6, result7, result8);
    }
  }
  for (let index3 = 0; index3 < value3; index3++) {
    for (let index4 = 0; index4 < value4; index4++) {
      let result9 = index3 * (value4 + 1) + index4;
      let result10 = result9 + value4 + 1;
      values3.push(result9, result9 + 1, result10, result10, result9 + 1, result10 + 1);
    }
  }
  let geometry = new THREE.BufferGeometry();
  geometry.setAttribute(`position`, new THREE.Float32BufferAttribute(values, 3));
  geometry.setAttribute(`normal`, new THREE.Float32BufferAttribute(values2, 3));
  geometry.setIndex(values3);
  return geometry;
}
