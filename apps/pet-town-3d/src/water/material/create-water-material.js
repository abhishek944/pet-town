/** Water material uniforms and surface shader assembly. */
import * as THREE from "three";
import { waterState } from "../state.js";
export function createWaterMaterial() {
  let callback = (value2) => new THREE.Color(value2);
  let options = {
    uTime: {
      value: 0,
    },
    uSurfaceY: {
      value: 2.85,
    },
    uHeightTex: {
      value: null,
    },
    uWaterTex: {
      value: null,
    },
    uHeightRect: {
      value: new THREE.Vector4(0, 0, 1, 1),
    },
    uSunDir: {
      value: new THREE.Vector3(0.4, 0.8, 0.3).normalize(),
    },
    uLightDir: {
      value: new THREE.Vector3(0.4, 0.8, 0.3).normalize(),
    },
    uSunColor: {
      value: new THREE.Color(2, 2, 2),
    },
    uSkyHorizon: {
      value: callback(13627132),
    },
    uSkyZenith: {
      value: callback(7128306),
    },
    uShallow: {
      value: callback(4511968),
    },
    uMid: {
      value: callback(1553108),
    },
    uDeep: {
      value: callback(1400004),
    },
    uTint: {
      value: callback(11071220),
    },
    uFoam: {
      value: callback(15400442),
    },
    uBank: {
      value: callback(5073722),
    },
    uAbsorb: {
      value: new THREE.Vector3(0.4, 0.08, 0.04),
    },
    uRipples: {
      value: Array.from(
        {
          length: 32,
        },
        () => new THREE.Vector4(0, 0, -99, 0),
      ),
    },
    uFade: {
      value: new THREE.Vector2(250, 520),
    },
    uNight: {
      value: 0,
    },
    uReflTex: {
      value: null,
    },
    uReflMatrix: {
      value: new THREE.Matrix4(),
    },
    uReflOn: {
      value: 0,
    },
    uSceneTex: {
      value: null,
    },
    uAlphaOut: {
      value: 1,
    },
    uSceneDisplay: {
      value: 0,
    },
    uSceneTM: {
      value: 0,
    },
    uSceneExposure: {
      value: 1,
    },
    uTune: {
      value: new THREE.Vector4(1.6, 0.9, 1, 1),
    },
    uTune2: {
      value: new THREE.Vector4(1, 1, 1, 0),
    },
  };
  let meshPhysicalMaterial = new THREE.MeshPhysicalMaterial({
    color: 16777215,
    roughness: 1,
    metalness: 0,
    transmission: 1,
    thickness: 0,
    ior: 1.33,
    specularIntensity: 0,
  });
  meshPhysicalMaterial.name = `water`;
  meshPhysicalMaterial.onBeforeCompile = (uniformsValue) => {
    Object.assign(uniformsValue.uniforms, options);
    uniformsValue.vertexShader = uniformsValue.vertexShader
      .replace(`void main() {`, `${waterState.waterSurfaceVertexDeclarations}\nvoid main() {`)
      .replace(`#include <begin_vertex>`, waterState.waterSurfaceVertexTransform);
    uniformsValue.fragmentShader = uniformsValue.fragmentShader
      .replace(`void main() {`, `${waterState.waterSurfaceFragmentDeclarations}\nvoid main() {`)
      .replace(`#include <transmission_fragment>`, ``)
      .replace(`#include <opaque_fragment>`, waterState.waterSurfaceFragmentOutput);
  };
  meshPhysicalMaterial.customProgramCacheKey = () => `pet-town-water-v3`;
  return {
    material: meshPhysicalMaterial,
    uniforms: options,
  };
}
