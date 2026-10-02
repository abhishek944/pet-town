/** Shared fog/cloud-shadow uniforms and Three.js shader chunk integration. */
import sourceAsset12 from "./assets/install-sky-shader-patches-12.glsl?raw";
import sourceAsset13 from "./assets/install-sky-shader-patches-13.glsl?raw";
import * as THREE from "three";
import { skyState } from "../state.js";
export function installSkyShaderPatches() {
  if (skyState.skyShaderPatchesInstalled) {
    return;
  }
  skyState.skyShaderPatchesInstalled = true;
  let ShaderChunk2 = THREE.ShaderChunk;
  ShaderChunk2.fog_pars_vertex = `
#ifdef USE_FOG
	varying float vFogDepth;
	varying vec3 vFogWorldDir;
#endif`;
  ShaderChunk2.fog_vertex = `
#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
	vFogWorldDir = mvPosition.xyz * mat3( viewMatrix );
#endif`;
  ShaderChunk2.fog_pars_fragment = `
#ifdef USE_FOG
	uniform vec3 fogColor;
	uniform vec3 fogSunDir;
	uniform vec3 fogSunColor;
	varying float vFogDepth;
	varying vec3 vFogWorldDir;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`;
  ShaderChunk2.fog_fragment = sourceAsset12;
  let result =
    /shadow = \(\s*texture\( shadowMap, vec3\( shadowCoord\.xy \+ vogelDiskSample\( 0, 5, phi \)[\s\S]*?\) \* 0\.2;/;
  if (result.test(ShaderChunk2.shadowmap_pars_fragment)) {
    ShaderChunk2.shadowmap_pars_fragment = ShaderChunk2.shadowmap_pars_fragment.replace(
      result,
      `float skyPcf = 0.0;
				for ( int skyI = 0; skyI < 12; skyI ++ ) {
					skyPcf += texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( skyI, 12, phi ) * radius, shadowCoord.z ) );
				}
				shadow = skyPcf * ( 1.0 / 12.0 );`,
    );
  }
  ShaderChunk2.shadowmap_pars_fragment = ShaderChunk2.shadowmap_pars_fragment.replace(
    /(#ifdef USE_SHADOWMAP)/,
    sourceAsset13,
  );
  let result2 =
    /(directLight\.color \*= \( directLight\.visible && receiveShadow \) \? getShadow\( directionalShadowMap\[ i \][^;]*vDirectionalShadowCoord\[ i \] \) : 1\.0);/;
  if (result2.test(ShaderChunk2.lights_fragment_begin)) {
    ShaderChunk2.lights_fragment_begin = ShaderChunk2.lights_fragment_begin.replace(
      result2,
      `$1;
		directLight.color *= skyCloudShadow( vDirectionalShadowCoord[ i ] );`,
    );
  }
  ShaderChunk2.shadowmap_pars_vertex = ShaderChunk2.shadowmap_pars_vertex.replace(
    /(#if NUM_DIR_LIGHT_SHADOWS > 0)/,
    `$1
		uniform vec4 skyCloudShadowL;`,
  );
  let result3 =
    /shadowWorldPosition = worldPosition \+ vec4\( shadowWorldNormal \* directionalLightShadows\[ i \]\.shadowNormalBias, 0 \);/;
  if (result3.test(ShaderChunk2.shadowmap_vertex)) {
    ShaderChunk2.shadowmap_vertex = ShaderChunk2.shadowmap_vertex.replace(
      result3,
      `float skyNL = dot( shadowWorldNormal, skyCloudShadowL.xyz );
			float skySlope = dot( skyCloudShadowL.xyz, skyCloudShadowL.xyz ) > 0.25 ? mix( 2.2, 0.6, clamp( skyNL, 0.0, 1.0 ) ) : 1.0;
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * directionalLightShadows[ i ].shadowNormalBias * skySlope, 0 );`,
    );
  }
  let callback = (value2) => {
    if (value2) {
      for (let result4 in skyState.skyGlobalShaderUniforms) {
        value2[result4] = {
          value: skyState.skyGlobalShaderUniforms[result4],
        };
      }
    }
  };
  callback(THREE.UniformsLib.fog);
  callback(THREE.UniformsLib.lights);
  for (let result5 in THREE.ShaderLib) {
    callback(THREE.ShaderLib[result5].uniforms);
  }
}
