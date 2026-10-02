/** Recycled splash particle pool and gravity-driven droplets with impact callbacks. */
import * as THREE from "three";
import { waterState } from "../state.js";
export function createWaterSplashParticles(addValue) {
  let floatBuffer = new Float32Array(waterState.waterSplashParticleCapacity * 3);
  let floatBuffer2 = new Float32Array(waterState.waterSplashParticleCapacity * 3);
  let floatBuffer3 = new Float32Array(waterState.waterSplashParticleCapacity);
  let floatBuffer4 = new Float32Array(waterState.waterSplashParticleCapacity);
  let floatBuffer5 = new Float32Array(waterState.waterSplashParticleCapacity);
  let geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    `position`,
    new THREE.BufferAttribute(floatBuffer, 3).setUsage(THREE.DynamicDrawUsage),
  );
  geometry.setAttribute(
    `aSize`,
    new THREE.BufferAttribute(floatBuffer4, 1).setUsage(THREE.DynamicDrawUsage),
  );
  geometry.setAttribute(
    `aAlpha`,
    new THREE.BufferAttribute(floatBuffer5, 1).setUsage(THREE.DynamicDrawUsage),
  );
  geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e5);
  let shaderMaterial = new THREE.ShaderMaterial({
    uniforms: {
      uColor: {
        value: new THREE.Color(15925245),
      },
      uLight: {
        value: 1,
      },
      uScale: {
        value: 400,
      },
    },
    vertexShader: `
      attribute float aSize; attribute float aAlpha; varying float vA; uniform float uScale;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = aSize * uScale / max(-mv.z, 0.1);
        vA = aAlpha;
      }`,
    fragmentShader: `
      uniform vec3 uColor; uniform float uLight; varying float vA;
      void main() {
        vec2 p = gl_PointCoord * 2.0 - 1.0;
        float r = dot(p, p);
        if (r > 1.0) discard;
        float a = (1.0 - smoothstep(0.35, 1.0, r)) * vA;
        vec3 c = uColor * uLight * (0.85 + 0.3 * (1.0 - r));
        gl_FragColor = vec4(c, a);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
    transparent: true,
    depthWrite: false,
  });
  let points2 = new THREE.Points(geometry, shaderMaterial);
  points2.frustumCulled = false;
  points2.renderOrder = 2;
  points2.name = `water-splashes`;
  addValue.add(points2);
  let index = 0;
  function result() {
    for (let index2 = 0; index2 < waterState.waterSplashParticleCapacity; index2++) {
      let result4 = (index + index2) % waterState.waterSplashParticleCapacity;
      if (floatBuffer3[result4] <= 0) {
        index = result4 + 1;
        return result4;
      }
    }
    index = (index + 1) % waterState.waterSplashParticleCapacity;
    return index;
  }
  function result2(value2, value3, value4, value5 = 1) {
    let result5 = Math.max(0.2, Math.min(value5, 3));
    let result6 = Math.round(10 + 22 * result5);
    for (let index3 = 0; index3 < result6; index3++) {
      let resultResult = result();
      let result7 = Math.random() * Math.PI * 2;
      let result8 = Math.random() * 0.35 * result5;
      let result9 = (2.2 + Math.random() * 2.6) * Math.sqrt(result5);
      let result10 = (0.4 + Math.random() * 1.3) * Math.sqrt(result5);
      floatBuffer[resultResult * 3] = value2 + Math.cos(result7) * result8;
      floatBuffer[resultResult * 3 + 1] = value3 + 0.02;
      floatBuffer[resultResult * 3 + 2] = value4 + Math.sin(result7) * result8;
      floatBuffer2[resultResult * 3] = Math.cos(result7) * result10;
      floatBuffer2[resultResult * 3 + 1] = result9;
      floatBuffer2[resultResult * 3 + 2] = Math.sin(result7) * result10;
      floatBuffer3[resultResult] = 0.7 + Math.random() * 0.8;
      floatBuffer4[resultResult] = (0.05 + Math.random() * 0.09) * (0.8 + 0.2 * result5);
      floatBuffer5[resultResult] = 1;
    }
  }
  function result3(value6, value7, value8, value9 = 1) {
    let enabled = false;
    for (let index4 = 0; index4 < waterState.waterSplashParticleCapacity; index4++) {
      if (floatBuffer3[index4] <= 0) {
        if (floatBuffer5[index4] !== 0) {
          floatBuffer5[index4] = 0;
          enabled = true;
        }
        continue;
      }
      enabled = true;
      floatBuffer3[index4] -= value6;
      floatBuffer2[index4 * 3 + 1] -= 13 * value6;
      let result11 = Math.exp(-0.8 * value6);
      floatBuffer2[index4 * 3] *= result11;
      floatBuffer2[index4 * 3 + 2] *= result11;
      floatBuffer[index4 * 3] += floatBuffer2[index4 * 3] * value6;
      floatBuffer[index4 * 3 + 1] += floatBuffer2[index4 * 3 + 1] * value6;
      floatBuffer[index4 * 3 + 2] += floatBuffer2[index4 * 3 + 2] * value6;
      let value7Result = value7(floatBuffer[index4 * 3], floatBuffer[index4 * 3 + 2]);
      if (floatBuffer2[index4 * 3 + 1] < 0 && floatBuffer[index4 * 3 + 1] < value7Result) {
        if (Math.random() < 0.18) {
          value8?.(floatBuffer[index4 * 3], floatBuffer[index4 * 3 + 2]);
        }
        floatBuffer3[index4] = 0;
      }
      floatBuffer5[index4] = floatBuffer3[index4] <= 0 ? 0 : Math.min(1, floatBuffer3[index4] * 4);
    }
    shaderMaterial.uniforms.uLight.value = value9;
    if (enabled) {
      geometry.attributes.position.needsUpdate = true;
      geometry.attributes.aSize.needsUpdate = true;
      geometry.attributes.aAlpha.needsUpdate = true;
    }
  }
  return {
    points: points2,
    spawn: result2,
    update: result3,
    setScale(value10) {
      shaderMaterial.uniforms.uScale.value = value10;
    },
  };
}
