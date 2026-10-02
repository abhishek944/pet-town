/** Shared creature materials, fur shading, emissive variants and day-night lighting. */
import * as THREE from "three";
import { creaturesState } from "../state.js";
export function applyCreatureStylizedShading(
  userDataValue,
  {
    rim: value2 = 0.35,
    power: toFixedValue = 2.4,
    tint: toFixedValue2 = 0.75,
    lift: value3 = 0.08,
    ramp: value4 = 0.6,
    fur: toFixedValue3 = 0,
    furScale: toFixedValue4 = 38,
    key: value5 = `cr`,
    uber: value6 = false,
  } = {},
) {
  let userData2 = userDataValue.userData;
  userData2.rim = {
    value: value2,
  };
  userData2.rimBase = value2;
  userData2.lift = {
    value: value3,
  };
  userData2.liftBase = value3;
  userData2.rimColor = {
    value: new THREE.Color(16054527),
  };
  userData2.glow = {
    value: 0,
  };
  userData2.ramp = {
    value: value4,
  };
  userData2.lum = {
    value: 0,
  };
  userData2.spot = {
    value: 1,
  };
  userData2.hi = {
    value: 1.45,
  };
  userDataValue.onBeforeCompile = (uniformsValue) => {
    uniformsValue.uniforms.uRim = userData2.rim;
    uniformsValue.uniforms.uLift = userData2.lift;
    uniformsValue.uniforms.uRimColor = userData2.rimColor;
    uniformsValue.uniforms.uGlow = userData2.glow;
    uniformsValue.uniforms.uRamp = userData2.ramp;
    uniformsValue.uniforms.uLum = userData2.lum;
    uniformsValue.uniforms.uSpot = userData2.spot;
    uniformsValue.uniforms.uHi = userData2.hi;
    uniformsValue.vertexShader = uniformsValue.vertexShader
      .replace(
        `#include <common>`,
        `#include <common>
varying vec3 vCrObj;` +
          (value6
            ? `
attribute vec4 crp; varying vec4 vCrp;`
            : ``),
      )
      .replace(
        `#include <begin_vertex>`,
        `#include <begin_vertex>
vCrObj = position;` +
          (value6
            ? `
vCrp = crp;`
            : ``),
      );
    let replaceResult = uniformsValue.fragmentShader.replace(
      `#include <common>`,
      `#include <common>
uniform float uRim; uniform float uLift; uniform vec3 uRimColor; uniform float uGlow; uniform float uRamp; uniform float uLum; uniform float uSpot; uniform float uHi;
varying vec3 vCrObj;
${value6 ? `varying vec4 vCrp;` : ``}
${creaturesState.creatureFurNoiseGlsl}`,
    );
    if (
      (creaturesState.creatureWrappedLightingChunk &&
        (replaceResult = replaceResult.replace(
          `#include <lights_physical_pars_fragment>`,
          creaturesState.creatureWrappedLightingChunk,
        )),
      value6)
    ) {
      replaceResult = replaceResult
        .replace(
          `#include <roughnessmap_fragment>`,
          `#include <roughnessmap_fragment>
  roughnessFactor = vCrp.x;`,
        )
        .replace(
          `#include <normal_fragment_begin>`,
          `#include <normal_fragment_begin>
  if (vCrp.z > 0.01) {
    vec3 q = vCrObj * ${toFixedValue4.toFixed(1)};
    vec3 nn = vec3(crNoise(q), crNoise(q + 17.3), crNoise(q + 41.7)) - 0.5;
    vec3 nn2 = vec3(crNoise(q * 2.7 + 5.1), crNoise(q * 2.7 + 9.4), crNoise(q * 2.7 + 3.3)) - 0.5;
    normal = normalize(normal + (nn * 0.7 + nn2 * 0.3) * vCrp.z);
  }`,
        )
        .replace(
          `#include <opaque_fragment>`,
          `{
  vec3 vdir = normalize(vViewPosition);
  float ndv = clamp(dot(normal, vdir), 0.0, 1.0);
  float fr = pow(1.0 - ndv, ${toFixedValue.toFixed(2)});
  float up = 0.45 + 0.55 * clamp(normal.y * 0.5 + 0.5, 0.0, 1.0);
  outgoingLight += uRimColor * mix(vec3(1.0), diffuseColor.rgb, ${toFixedValue2.toFixed(2)}) * fr * uRim * up * step(0.3, vCrp.x); // no edge light on glossy eyes
  outgoingLight += diffuseColor.rgb * (uLift + vCrp.w * uLum);
  if (vCrp.y > 0.5) outgoingLight = diffuseColor.rgb * (vCrp.y > 1.5 ? uSpot : uHi);
}
#include <opaque_fragment>`,
        );
      uniformsValue.fragmentShader = replaceResult;
      return;
    }
    if (toFixedValue3 > 0) {
      replaceResult = replaceResult.replace(
        `#include <normal_fragment_begin>`,
        `#include <normal_fragment_begin>
  {
    vec3 q = vCrObj * ${toFixedValue4.toFixed(1)};
    vec3 nn = vec3(crNoise(q), crNoise(q + 17.3), crNoise(q + 41.7)) - 0.5;
    vec3 nn2 = vec3(crNoise(q * 2.7 + 5.1), crNoise(q * 2.7 + 9.4), crNoise(q * 2.7 + 3.3)) - 0.5;
    normal = normalize(normal + (nn * 0.7 + nn2 * 0.3) * ${toFixedValue3.toFixed(2)});
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
  outgoingLight += diffuseColor.rgb * (uLift + uGlow);
}
#include <opaque_fragment>`,
    );
    uniformsValue.fragmentShader = replaceResult;
  };
  userDataValue.customProgramCacheKey = () =>
    `${value5}|${toFixedValue}|${toFixedValue2}|${toFixedValue3}|${toFixedValue4}|${value6}`;
  return userDataValue;
}
