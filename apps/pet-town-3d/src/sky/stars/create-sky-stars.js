/** Twinkling star shaders and deterministic point-field creation. */
import * as THREE from "three";
import { skyState } from "../state.js";
export function createSkyStars(value, value2 = 4200) {
  let floatBuffer = new Float32Array(value2 * 3);
  let floatBuffer2 = new Float32Array(value2);
  let floatBuffer3 = new Float32Array(value2);
  let floatBuffer4 = new Float32Array(value2 * 3);
  let result = 1234567;
  let callback = () => (result = (result * 16807) % 2147483647) / 2147483647;
  let values = [
    [0.85, 0.9, 1.25],
    [1.2, 1.05, 0.85],
    [1.15, 0.85, 1.05],
    [1, 1, 1.05],
    [0.8, 1.1, 1.2],
  ];
  for (let index = 0; index < value2; index++) {
    let result2 = callback() * 2 - 1;
    let result3 = callback() * Math.PI * 2;
    let result4 = Math.sqrt(1 - result2 * result2);
    floatBuffer.set([result4 * Math.cos(result3), result2, result4 * Math.sin(result3)], index * 3);
    let result5 = callback() ** 7;
    floatBuffer2[index] = 0.9 + result5 * 3.6;
    floatBuffer3[index] = callback();
    let result6 = values[Math.floor(callback() * values.length)];
    let result7 = (0.35 + result5 * 3) * (0.55 + callback() * 0.6);
    floatBuffer4.set([result6[0] * result7, result6[1] * result7, result6[2] * result7], index * 3);
  }
  let geometry = new THREE.BufferGeometry();
  geometry.setAttribute(`position`, new THREE.BufferAttribute(floatBuffer, 3));
  geometry.setAttribute(`aSize`, new THREE.BufferAttribute(floatBuffer2, 1));
  geometry.setAttribute(`aSeed`, new THREE.BufferAttribute(floatBuffer3, 1));
  geometry.setAttribute(`aColor`, new THREE.BufferAttribute(floatBuffer4, 3));
  let points = new THREE.Points(
    geometry,
    new THREE.ShaderMaterial({
      uniforms: value,
      vertexShader: skyState.skyStarsVertexShader,
      fragmentShader: skyState.skyStarsFragmentShader,
      transparent: true,
      depthWrite: false,
      depthTest: true,
      blending: 2,
      fog: false,
    }),
  );
  points.name = `skyStars`;
  points.frustumCulled = false;
  points.renderOrder = -1e3;
  points.matrixAutoUpdate = false;
  return points;
}
