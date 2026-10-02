/** Canopy surface intersections, rounded clumps and silhouette fringe cards. */
import * as THREE from "three";
import { vegetationState } from "../state.js";
export function createFoliageFringeCards(value, value2, value3) {
  let values = [];
  let values2 = [];
  let values3 = [];
  let values4 = [];
  let values5 = [];
  let values6 = [];
  let values7 = [];
  let values8 = [];
  for (let result of value) {
    let result2 = value3[0] + (value3[1] - value3[0]) * value2();
    let result3 = result.rot ?? value2() * vegetationState.foliageFullTurn;
    let result4 = Math.cos(result3);
    let result5 = Math.sin(result3);
    let result6 = values.length / 3;
    for (let [result7, result8] of [
      [-1, -1],
      [1, -1],
      [1, 1],
      [-1, 1],
    ]) {
      values.push(result.p.x, result.p.y, result.p.z);
      values2.push(result.n.x, result.n.y, result.n.z);
      values3.push((result7 + 1) / 2, (result8 + 1) / 2);
      values4.push(...result.c);
      values5.push(result.s);
      values6.push(1);
      values7.push(
        result7 * result4 - result8 * result5,
        result7 * result5 + result8 * result4,
        result2,
      );
    }
    values8.push(result6, result6 + 1, result6 + 2, result6, result6 + 2, result6 + 3);
  }
  let geometry = new THREE.BufferGeometry();
  geometry.setAttribute(`position`, new THREE.Float32BufferAttribute(values, 3));
  geometry.setAttribute(`normal`, new THREE.Float32BufferAttribute(values2, 3));
  geometry.setAttribute(`uv`, new THREE.Float32BufferAttribute(values3, 2));
  geometry.setAttribute(`color`, new THREE.Float32BufferAttribute(values4, 3));
  geometry.setAttribute(`aSway`, new THREE.Float32BufferAttribute(values5, 1));
  geometry.setAttribute(`aTint`, new THREE.Float32BufferAttribute(values6, 1));
  geometry.setAttribute(`aCard`, new THREE.Float32BufferAttribute(values7, 3));
  geometry.setIndex(values8);
  geometry.computeBoundingSphere();
  geometry.boundingSphere.radius += value3[1] * 1.5;
  return geometry;
}
