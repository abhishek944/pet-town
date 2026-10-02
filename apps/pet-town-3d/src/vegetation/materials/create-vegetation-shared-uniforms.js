/** Vegetation shared uniforms, shader chunks, wind displacement, camera fading and material assembly. */
import * as THREE from "three";
export function createVegetationSharedUniforms() {
  return {
    uTime: {
      value: 0,
    },
    uWind: {
      value: new THREE.Vector3(0.83, 0.55, 1),
    },
    uGust: {
      value: 1,
    },
    uPushers: {
      value: Array.from(
        {
          length: 6,
        },
        () => new THREE.Vector4(0, -1e5, 0, 0),
      ),
    },
    uSunDir: {
      value: new THREE.Vector3(0.5, 0.8, 0.3).normalize(),
    },
    uSunDirView: {
      value: new THREE.Vector3(0, 1, 0),
    },
    uSunLight: {
      value: new THREE.Color(1, 1, 1),
    },
    uFadeA: {
      value: new THREE.Vector3(),
    },
    uFadeB: {
      value: new THREE.Vector3(),
    },
    uFadeR: {
      value: 0,
    },
  };
}
