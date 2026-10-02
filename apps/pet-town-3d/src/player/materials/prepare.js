/** Player felt shading, wrapped lighting, dither fading and day-night material uniforms. */
import * as THREE from "three";
import { playerState } from "../state.js";
export function preparePlayerMaterials() {
  playerState.playerWrappedLightingChunk = (() => {
    let lights_physical_pars_fragment2 = THREE.ShaderChunk.lights_physical_pars_fragment;
    let text = `float dotNL = saturate( dot( geometryNormal, directLight.direction ) );`;
    return lights_physical_pars_fragment2.includes(text)
      ? lights_physical_pars_fragment2.replace(
          text,
          `float nlRaw = dot( geometryNormal, directLight.direction );
	float nlWrap = saturate( ( nlRaw + 0.4 ) / 1.4 );
	float nlBands = smoothstep( 0.16, 0.3, nlWrap ) * 0.52 + smoothstep( 0.52, 0.66, nlWrap ) * 0.3 + smoothstep( 0.84, 0.97, nlWrap ) * 0.18;
	float dotNL = mix( nlWrap, nlBands, uRamp ) * 0.92;`,
        )
      : null;
  })();
  playerState.playerFeltNoiseGlsl = `
float ppHash(vec3 p){ p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float ppNoise(vec3 x){ vec3 i = floor(x); vec3 f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(ppHash(i), ppHash(i + vec3(1,0,0)), f.x), mix(ppHash(i + vec3(0,1,0)), ppHash(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(ppHash(i + vec3(0,0,1)), ppHash(i + vec3(1,0,1)), f.x), mix(ppHash(i + vec3(0,1,1)), ppHash(i + vec3(1,1,1)), f.x), f.y), f.z); }
`;
  playerState.playerStylizedMaterials = [];
  playerState.playerFadeUniform = {
    value: 1,
  };
  playerState.playerFadeDeclarationGlsl = `
uniform float uPipFade;
float pipBayer(vec2 p){ vec2 q = mod(floor(p), 4.0); float i = q.x + q.y * 4.0;
  float b = mod(i * 7.0 + floor(i / 4.0) * 3.0, 16.0); return (b + 0.5) / 16.0; }
`;
  playerState.playerFadeDiscardGlsl = `if (uPipFade < 0.999 && pipBayer(gl_FragCoord.xy) > uPipFade) discard;`;
  playerState.playerNightTint = new THREE.Color(0.72, 0.8, 1);
  playerState.playerDayRimColor = new THREE.Color(16054527);
  playerState.playerNightRimColor = new THREE.Color(10467583);
  playerState.playerTintUniform = {
    value: new THREE.Color(1, 1, 1),
  };
}
