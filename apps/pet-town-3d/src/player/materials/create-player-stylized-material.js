/** Player felt shading, wrapped lighting, dither fading and day-night material uniforms. */
import * as THREE from "three";
import { playerState } from "../state.js";
export function createPlayerStylizedMaterial(
  value2,
  {
    rough: value7 = 0.85,
    rim: value8 = 0.3,
    power: toFixedValue = 2.4,
    tint: toFixedValue2 = 0.75,
    lift: value9 = 0.08,
    ramp: value10 = 0.55,
    felt: value11 = 0.08,
    feltN: toFixedValue3 = 0.18,
    feltScale: toFixedValue4 = 48,
    side: value3,
    vertexColors: value4,
    transparent: value5,
    opacity: value6,
    key: value12 = `pip`,
    nightWarm: value13 = 0.06,
  } = {},
) {
  let meshStandardMaterial = new THREE.MeshStandardMaterial({
    color: value2,
    roughness: value7,
    metalness: 0,
    side: value3 ?? 0,
    vertexColors: !!value4,
    transparent: !!value5,
    opacity: value6 ?? 1,
  });
  let userData2 = meshStandardMaterial.userData;
  userData2.rim = {
    value: value8,
  };
  userData2.rimBase = value8;
  userData2.lift = {
    value: value9,
  };
  userData2.liftBase = value9;
  userData2.ramp = {
    value: value10,
  };
  userData2.rimColor = {
    value: new THREE.Color(16054527),
  };
  userData2.felt = {
    value: value11,
  };
  userData2.warm = {
    value: 0,
  };
  userData2.warmBase = value13;
  meshStandardMaterial.onBeforeCompile = (uniformsValue) => {
    Object.assign(uniformsValue.uniforms, {
      uRim: userData2.rim,
      uLift: userData2.lift,
      uRamp: userData2.ramp,
      uRimColor: userData2.rimColor,
      uFelt: userData2.felt,
      uPipFade: playerState.playerFadeUniform,
      uTint: playerState.playerTintUniform,
      uWarm: userData2.warm,
    });
    uniformsValue.vertexShader = uniformsValue.vertexShader
      .replace(
        `#include <common>`,
        `#include <common>
varying vec3 vPipObj;`,
      )
      .replace(
        `#include <begin_vertex>`,
        `#include <begin_vertex>
vPipObj = position * vec3(length(modelMatrix[0].xyz), length(modelMatrix[1].xyz), length(modelMatrix[2].xyz));`,
      );
    let replaceResult = uniformsValue.fragmentShader
      .replace(
        `#include <common>`,
        `#include <common>
uniform float uRim; uniform float uLift; uniform float uRamp; uniform vec3 uRimColor; uniform float uFelt; uniform vec3 uTint; uniform float uWarm;
varying vec3 vPipObj;
${playerState.playerFeltNoiseGlsl}${playerState.playerFadeDeclarationGlsl}`,
      )
      .replace(
        `#include <clipping_planes_fragment>`,
        `#include <clipping_planes_fragment>
` + playerState.playerFadeDiscardGlsl,
      );
    if (playerState.playerWrappedLightingChunk) {
      replaceResult = replaceResult.replace(
        `#include <lights_physical_pars_fragment>`,
        playerState.playerWrappedLightingChunk,
      );
    }
    replaceResult = replaceResult.replace(
      `#include <color_fragment>`,
      `#include <color_fragment>
  diffuseColor.rgb *= uTint;`,
    );
    if (value11 > 0) {
      replaceResult = replaceResult.replace(
        `#include <color_fragment>`,
        `#include <color_fragment>
  {
    vec3 q = vPipObj * ${toFixedValue4.toFixed(1)};
    float fib = ppNoise(q * vec3(1.0, 2.6, 1.0)) * 0.6 + ppNoise(q * 2.3 + 7.1) * 0.4;   // fine fibres
    float mot = ppNoise(vPipObj * 9.0 + 3.7);                                             // soft mottling
    diffuseColor.rgb *= 1.0 + uFelt * ((fib - 0.5) * 1.2 + (mot - 0.5) * 0.35);
  }`,
      );
    }
    if (toFixedValue3 > 0) {
      replaceResult = replaceResult.replace(
        `#include <normal_fragment_begin>`,
        `#include <normal_fragment_begin>
  {
    vec3 q = vPipObj * ${(toFixedValue4 * 0.8).toFixed(1)};
    vec3 nn = vec3(ppNoise(q), ppNoise(q + 17.3), ppNoise(q + 41.7)) - 0.5;
    normal = normalize(normal + nn * ${toFixedValue3.toFixed(2)});
  }`,
      );
    }
    replaceResult = replaceResult.replace(
      `#include <opaque_fragment>`,
      `{
  vec3 vdir = normalize(vViewPosition);
  float ndv = clamp(dot(normal, vdir), 0.0, 1.0);
  float fr = pow(1.0 - ndv, ${toFixedValue.toFixed(2)});
  float up = 0.45 + 0.55 * clamp(normal.y * 0.5 + 0.5, 0.0, 1.0);
  outgoingLight += uRimColor * mix(vec3(1.0), diffuseColor.rgb, ${toFixedValue2.toFixed(2)}) * fr * uRim * up;
  outgoingLight += diffuseColor.rgb * uLift;
  outgoingLight += diffuseColor.rgb * vec3(1.0, 0.8, 0.6) * uWarm;   // warm 'lantern' lift at night (skin mostly)
}
#include <opaque_fragment>`,
    );
    uniformsValue.fragmentShader = replaceResult;
  };
  meshStandardMaterial.customProgramCacheKey = () =>
    `${value12}|${toFixedValue}|${toFixedValue2}|${value11 > 0}|${toFixedValue3}|${toFixedValue4}`;
  playerState.playerStylizedMaterials.push(meshStandardMaterial);
  return meshStandardMaterial;
}
