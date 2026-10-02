/** Vegetation shared uniforms, shader chunks, wind displacement, camera fading and material assembly. */
import * as THREE from "three";
import { patchVegetationVertexShader } from "./patch-vegetation-vertex-shader.js";
import { vegetationState } from "../state.js";
export function createVegetationMaterial(value2, values = {}) {
  let meshLambertMaterial = new THREE.MeshLambertMaterial({
    vertexColors: true,
    map: values.map || null,
    side: values.side ?? 0,
    transparent: !!values.transparent,
    depthWrite: true,
    alphaTest: values.alphaTest ?? 0,
  });
  if (values.emissive) {
    meshLambertMaterial.emissive = new THREE.Color(values.emissive);
  }
  if (meshLambertMaterial.transparent) {
    meshLambertMaterial.forceSinglePass = true;
  }
  let options = {
    uSwayAmp: {
      value: values.swayAmp ?? 0.1,
    },
    uSwayFreq: {
      value: values.swayFreq ?? 1.7,
    },
    uRustle: {
      value: values.rustle ?? 0,
    },
    uPushAmt: {
      value: values.push ?? 0,
    },
    uFade: {
      value: new THREE.Vector2(values.fadeStart ?? 1e5, values.fadeEnd ?? 2e5),
    },
    uNearFade: {
      value: new THREE.Vector2(...(values.nearFade ?? [0, 0])),
    },
    uTierScale: {
      value: new THREE.Vector3(1, 1, 1),
    },
    uTierTint: {
      value: 1,
    },
    uBob: {
      value: values.bob ?? 0,
    },
    uPatch: {
      value: values.patch ?? 0,
    },
    uRim: {
      value: values.rim ?? 0,
    },
    uTrans: {
      value: values.trans ?? 0,
    },
    uSoft: {
      value: values.soft ?? 0,
    },
    uTipGlow: {
      value: values.tipGlow ?? 0,
    },
    uNormalUp: {
      value: values.normalUp ?? 0,
    },
    uTriScale: {
      value: values.triScale ?? 0.5,
    },
    uBumpAmt: {
      value: values.bumpAmt ?? 0.1,
    },
    uBumpFreq: {
      value: values.bumpFreq ?? 2.2,
    },
    uToonWarm: {
      value: new THREE.Vector3(...(values.toonWarm ?? [1.08, 1.05, 0.92])),
    },
    uToonCool: {
      value: new THREE.Vector3(...(values.toonCool ?? [0.8, 0.88, 1])),
    },
  };
  let assignResult = Object.assign({}, value2, options);
  let result = !!values.billboard;
  meshLambertMaterial.onBeforeCompile = (uniformsValue) => {
    Object.assign(uniformsValue.uniforms, assignResult);
    uniformsValue.vertexShader = patchVegetationVertexShader(
      uniformsValue.vertexShader,
      false,
      result,
    ).replace(`#include <beginnormal_vertex>`, vegetationState.vegetationVertexNormalShader);
    uniformsValue.fragmentShader = uniformsValue.fragmentShader
      .replace(
        `#include <common>`,
        `#include <common>
` + vegetationState.vegetationFragmentCommonShader,
      )
      .replace(`#include <map_fragment>`, vegetationState.vegetationFragmentDiffuseShader)
      .replace(
        `#include <normal_fragment_begin>`,
        `#include <normal_fragment_begin>
#ifdef DOUBLE_SIDED
 normal *= faceDirection;
#endif`,
      )
      .replace(`#include <normal_fragment_maps>`, vegetationState.vegetationFragmentNormalShader)
      .replace(`#include <opaque_fragment>`, vegetationState.vegetationFragmentLightingShader);
  };
  let options2 = {};
  if (values.worldMap) {
    options2.VEG_WORLDMAP = ``;
  }
  if (values.bump) {
    options2.VEG_BUMP = ``;
  }
  if (result) {
    options2.VEG_BILLBOARD = ``;
  }
  if (values.toon) {
    options2.VEG_TOON = ``;
  }
  if (values.merged) {
    options2.VEG_MERGED = ``;
  }
  if (values.fade) {
    options2.VEG_FADE = ``;
  }
  meshLambertMaterial.defines = options2;
  meshLambertMaterial.customProgramCacheKey = () =>
    `veg-lambert-v7` + Object.keys(meshLambertMaterial.defines).join(``);
  meshLambertMaterial.userData.uniforms = assignResult;
  let result2 = null;
  if (values.castShadow) {
    result2 = new THREE.MeshDepthMaterial();
    result2.defines = values.merged
      ? {
          VEG_DEPTH: ``,
          VEG_MERGED: ``,
        }
      : {
          VEG_DEPTH: ``,
        };
    result2.onBeforeCompile = (uniformsValue2) => {
      Object.assign(uniformsValue2.uniforms, assignResult);
      uniformsValue2.vertexShader = patchVegetationVertexShader(
        uniformsValue2.vertexShader,
        true,
        false,
      );
    };
    result2.customProgramCacheKey = () => `veg-depth-v7` + (values.merged ? `m` : ``);
  }
  return {
    mat: meshLambertMaterial,
    depth: result2,
    uniforms: assignResult,
  };
}
