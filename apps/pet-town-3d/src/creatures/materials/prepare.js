/** Shared creature materials, fur shading, emissive variants and day-night lighting. */
import * as THREE from "three";
import { creaturesState } from "../state.js";
export function prepareCreaturesMaterials() {
  creaturesState.creatureMaterials = null;
  creaturesState.creatureWrappedLightingChunk = (() => {
    let lights_physical_pars_fragment2 = THREE.ShaderChunk.lights_physical_pars_fragment;
    let text = `float dotNL = saturate( dot( geometryNormal, directLight.direction ) );`;
    let text2 = `reflectedLight.directSpecular += irradiance * specularBRDF`;
    return !lights_physical_pars_fragment2.includes(text) ||
      !lights_physical_pars_fragment2.includes(text2)
      ? null
      : lights_physical_pars_fragment2
          .replace(
            text,
            `float nlRaw = dot( geometryNormal, directLight.direction );
	float nlWrap = saturate( ( nlRaw + 0.4 ) / 1.4 );
	float nlBands = smoothstep( 0.16, 0.3, nlWrap ) * 0.52 + smoothstep( 0.52, 0.66, nlWrap ) * 0.3 + smoothstep( 0.84, 0.97, nlWrap ) * 0.18;
	float dotNL = mix( nlWrap, nlBands, uRamp ) * 0.92;
	vec3 specIrradiance = saturate( nlRaw ) * directLight.color; // specular keeps the physical N.L (no back-side glints)`,
          )
          .replace(text2, `reflectedLight.directSpecular += specIrradiance * specularBRDF`);
  })();
  creaturesState.creatureFurNoiseGlsl = `
float crHash(vec3 p){ p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float crNoise(vec3 x){ vec3 i = floor(x); vec3 f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(crHash(i), crHash(i + vec3(1,0,0)), f.x), mix(crHash(i + vec3(0,1,0)), crHash(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(crHash(i + vec3(0,0,1)), crHash(i + vec3(1,0,1)), f.x), mix(crHash(i + vec3(0,1,1)), crHash(i + vec3(1,1,1)), f.x), f.y), f.z); }
`;
}
