/** Instanced particle presets, bursts, foliage drift, fireflies, pollen and motes. */
import * as THREE from "three";
import { createFxSpriteAtlas } from "../sprite-atlas/create-fx-sprite-atlas.js";
import { effectsState } from "../state.js";
import { emitParticleBurst } from "./emit-particle-burst.js";
import { registerParticleTree } from "./register-particle-tree.js";
import { countLivingParticles } from "./count-living-particles.js";
import { initializeParticleShowcase } from "./initialize-particle-showcase.js";
export function initializeParticleEffects(context) {
  let fxSpriteAtlasResult = createFxSpriteAtlas();
  let planeGeometry = new THREE.PlaneGeometry(1, 1);
  let instancedBufferGeometry = new THREE.InstancedBufferGeometry();
  instancedBufferGeometry.index = planeGeometry.index;
  instancedBufferGeometry.setAttribute(`position`, planeGeometry.getAttribute(`position`));
  let callback = (value2) => {
    let instancedBufferAttribute = new THREE.InstancedBufferAttribute(
      new Float32Array(effectsState.particlePoolCapacity * value2),
      value2,
    );
    instancedBufferAttribute.setUsage(THREE.DynamicDrawUsage);
    return instancedBufferAttribute;
  };
  let options = {
    iPos: callback(3),
    iVel: callback(3),
    iA: callback(4),
    iB: callback(4),
    iC: callback(4),
    iD: callback(4),
  };
  for (let index2 = 0; index2 < effectsState.particlePoolCapacity; index2++) {
    options.iA.array[index2 * 4 + 1] = -1;
  }
  for (let result2 in options) {
    instancedBufferGeometry.setAttribute(result2, options[result2]);
  }
  instancedBufferGeometry.instanceCount = effectsState.particlePoolCapacity;
  let options2 = {
    uTime: {
      value: 0,
    },
    uAtlas: {
      value: fxSpriteAtlasResult,
    },
    uLight: {
      value: new THREE.Color(1, 1, 1),
    },
    uSunDir: {
      value: new THREE.Vector3(0, 1, 0),
    },
    uFogColor: {
      value: new THREE.Color(1, 1, 1),
    },
    uFogNear: {
      value: 1e6,
    },
    uFogFar: {
      value: 2e6,
    },
  };
  let mesh2 = new THREE.Mesh(
    instancedBufferGeometry,
    new THREE.ShaderMaterial({
      uniforms: options2,
      vertexShader: effectsState.particleVertexShader,
      fragmentShader: effectsState.particleFragmentShader,
      transparent: true,
      depthWrite: false,
      depthTest: true,
      blending: 5,
      blendEquation: 100,
      blendSrc: 201,
      blendDst: 205,
      blendSrcAlpha: 200,
      blendDstAlpha: 201,
    }),
  );
  mesh2.frustumCulled = false;
  mesh2.renderOrder = 10;
  mesh2.name = `fx.particles`;
  context.scene.add(mesh2);
  let result = context.params?.get?.(`q`) === `low` ? 90 : 220;
  let instancedBufferGeometry2 = new THREE.InstancedBufferGeometry();
  instancedBufferGeometry2.index = planeGeometry.index;
  instancedBufferGeometry2.setAttribute(`position`, planeGeometry.getAttribute(`position`));
  let floatBuffer = new Float32Array(result * 4);
  for (let index3 = 0; index3 < floatBuffer.length; index3++) {
    floatBuffer[index3] = Math.random();
  }
  instancedBufferGeometry2.setAttribute(
    `iSeed`,
    new THREE.InstancedBufferAttribute(floatBuffer, 4),
  );
  instancedBufferGeometry2.instanceCount = result;
  let options3 = {
    uTime: {
      value: 0,
    },
    uAmt: {
      value: 0,
    },
    uCam: {
      value: new THREE.Vector3(),
    },
    uBox: {
      value: new THREE.Vector3(16, 9, 16),
    },
    uSunDir: {
      value: new THREE.Vector3(0, 1, 0),
    },
    uWind: {
      value: new THREE.Vector3(0.18, 0.03, 0.08),
    },
    uColor: {
      value: new THREE.Color(1.8, 1.5, 1),
    },
  };
  let mesh3 = new THREE.Mesh(
    instancedBufferGeometry2,
    new THREE.ShaderMaterial({
      uniforms: options3,
      vertexShader: effectsState.moteVertexShader,
      fragmentShader: effectsState.moteFragmentShader,
      transparent: true,
      depthWrite: false,
      blending: 5,
      blendEquation: 100,
      blendSrc: 201,
      blendDst: 201,
      blendSrcAlpha: 200,
      blendDstAlpha: 201,
    }),
  );
  mesh3.frustumCulled = false;
  mesh3.renderOrder = 11;
  mesh3.name = `fx.motes`;
  context.scene.add(mesh3);
  effectsState.particleEffectsState = {
    ctx: context,
    mesh: mesh2,
    attrs: options,
    uniforms: options2,
    moteU: options3,
    motes: mesh3,
    next: 0,
    time: 0,
    dirtyMin: 1 / 0,
    dirtyMax: -1,
    wrapped: false,
    trees: [],
    pop: {},
    focus: new THREE.Vector3(),
    tmp: new THREE.Vector3(),
    tmp2: new THREE.Vector3(),
  };
  context.fx = {
    burst: emitParticleBurst,
    emit: (value3, value4, value5 = {}) =>
      emitParticleBurst(value3, value4, {
        count: 1,
        ...value5,
      }),
    ambient: {
      enabled: context.params?.get?.(`ambient`) !== `0`,
      pollen: true,
      fireflies: true,
      petals: true,
      motes: true,
      density: 1,
    },
    kinds: Object.keys(effectsState.particlePresets),
    SPRITE: effectsState.fxSpriteKinds,
    addTree: (value6, value7 = {}) =>
      registerParticleTree(value6, {
        ...value7,
        manual: true,
      }),
    setTrees: (value8) => {
      effectsState.particleEffectsState.trees.length = 0;
      for (let result3 of value8) {
        registerParticleTree(result3, {
          manual: true,
        });
      }
    },
    stats: {
      get alive() {
        return countLivingParticles();
      },
    },
    mesh: mesh2,
  };
  if (context.params?.has?.(`fxTest`)) {
    initializeParticleShowcase(context);
  }
}
