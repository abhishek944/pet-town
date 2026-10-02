/** Terrain material shader injection for atlas sampling, edge overlays, moss, tint, wetness and lighting. */
import sourceAsset1 from "./assets/create-terrain-material-section-1-1.glsl?raw";
import sourceAsset2 from "./assets/create-terrain-material-section-2-2.glsl?raw";
import sourceAsset3 from "./assets/create-terrain-material-section-3-3.glsl?raw";
import sourceAsset4 from "./assets/create-terrain-material-section-4-4.glsl?raw";
import sourceAsset5 from "./assets/create-terrain-material-section-5-5.glsl?raw";
import sourceAsset6 from "./assets/create-terrain-material-section-1-6.glsl?raw";
import sourceAsset7 from "./assets/create-terrain-material-section-2-7.glsl?raw";
import sourceAsset8 from "./assets/create-terrain-material-section-1-8.glsl?raw";
import sourceAsset9 from "./assets/create-terrain-material-section-2-9.glsl?raw";
import sourceAsset10 from "./assets/create-terrain-material-section-3-10.glsl?raw";
import sourceAsset11 from "./assets/create-terrain-material-11.glsl?raw";
import * as THREE from "three";
import { terrainState } from "../state.js";
export function createTerrainMaterial(bumpValue, sharedValue = {}) {
  let meshStandardMaterial = new THREE.MeshStandardMaterial({
    color: 16777215,
    roughness: 0.93,
    metalness: 0,
  });
  let floatBuffer = new Float32Array(64);
  bumpValue.bump.forEach((value2, value3) => (floatBuffer[value3] = value2));
  let fillResult = new Float32Array(64).fill(1);
  (bumpValue.seam || []).forEach((value4, value5) => (fillResult[value5] = value4));
  let floatBuffer2 = new Float32Array(64);
  let result = sharedValue.shared
    ? sharedValue.shared.userData.uniforms
    : {
        uAtlas: {
          value: bumpValue.texture,
        },
        uBump: {
          value: floatBuffer,
        },
        uBumpScale: {
          value: sharedValue.bumpScale ?? 1,
        },
        uAODirect: {
          value: sharedValue.aoDirect ?? 0.35,
        },
        uSeam: {
          value: sharedValue.seam ?? 0.12,
        },
        uSeamL: {
          value: fillResult,
        },
        uEmit: {
          value: floatBuffer2,
        },
        uWaterLevel: {
          value: sharedValue.waterLevel ?? 0,
        },
        uLightDir: {
          value: new THREE.Vector3(0.5, 0.8, 0.3).normalize(),
        },
        uNight: {
          value: 0,
        },
        uDetail: {
          value: sharedValue.detail ?? 0.06,
        },
        uRim: {
          value: sharedValue.rim ?? 0.12,
        },
        uPillow: {
          value: 1,
        },
        uWarmShadow: {
          value: 0.2,
        },
        uFillFix: {
          value: new THREE.Vector3(1.22, 1, 0.76),
        },
        uWetOn: {
          value: 0,
        },
      };
  meshStandardMaterial.userData.uniforms = result;
  let result2 = !!sharedValue.lip;
  let result3 = null;
  meshStandardMaterial.userData.attachWetness = (glslValue) => {
    if (result3 || !glslValue?.glsl || !glslValue?.uniforms) {
      return false;
    }
    for (let result4 of [`uWaterTex`, `uWaterRect`, `uWaterSurfaceY`, `uWaterTime`]) {
      if (!glslValue.uniforms[result4]) {
        return false;
      }
    }
    Object.assign(result, glslValue.uniforms);
    result3 = glslValue.glsl;
    result.uWetOn.value = 1;
    meshStandardMaterial.needsUpdate = true;
    return true;
  };
  meshStandardMaterial.onBeforeCompile = (uniformsValue) => {
    Object.assign(uniformsValue.uniforms, result);
    uniformsValue.vertexShader = uniformsValue.vertexShader
      .replace(
        `#include <common>`,
        `#include <common>
attribute vec2 aUv;
attribute vec4 aData;
attribute vec4 aTint;
attribute vec4 aGrass;
varying vec3 vGTint;
flat varying float vEdge;
varying vec2 vTUv;
varying vec2 vLUv;
flat varying float vTile;
flat varying float vOver;
flat varying float vDir;
varying float vAO;
varying float vBevel;
varying vec3 vTint;
varying vec3 vWPos;
varying vec3 vWNrm;`,
      )
      .replace(
        `#include <begin_vertex>`,
        `#include <begin_vertex>
float dw = aData.w;
vDir = mod(dw, 8.0);
vec2 par = vec2(mod(floor(dw / 8.0), 2.0), floor(dw / 16.0));
vLUv = aUv; vTUv = (par + aUv) * 0.5;
vTile = aData.x; vOver = aData.y; vAO = aData.z / 255.0; vTint = aTint.rgb * 2.0; vBevel = aTint.a;
vGTint = aGrass.rgb / 127.5; vEdge = aGrass.a;
vWPos = (modelMatrix * vec4(position, 1.0)).xyz;
vWNrm = normalize(mat3(modelMatrix) * normal);`,
      );
    uniformsValue.fragmentShader = uniformsValue.fragmentShader
      .replace(
        `#include <common>`,
        sourceAsset1 +
          String(terrainState.terrainTextureLayerIds.FRINGE.toFixed(1)) +
          sourceAsset2 +
          String(terrainState.terrainTextureLayerIds.PATH_EDGE.toFixed(1)) +
          sourceAsset3 +
          String(terrainState.terrainTextureLayerIds.MOSS.toFixed(1)) +
          sourceAsset4 +
          String(result3 || ``) +
          sourceAsset5,
      )
      .replace(
        `#include <map_fragment>`,
        result2
          ? `
gDX = dFdx(vTUv); gDY = dFdy(vTUv);
gSX = dFdx(-vViewPosition); gSY = dFdy(-vViewPosition);
vec4 tL = textureGrad(uAtlas, vec3(vTUv, vTile), gDX, gDY);
float la = tL.a * smoothstep(0.3, 0.42, vLUv.y);
if (la < 0.72) discard;
vec3 col = tL.rgb * vTint;
float overA = 1.0, hgt = 0.5;
{
  float lum = dot(col, vec3(0.3, 0.59, 0.11));
  col = mix(col, vec3(lum) * vec3(0.88, 0.93, 1.04), uNight * 0.12);
}
diffuseColor.rgb *= col;
`
          : sourceAsset6 +
              String(
                result3 ? `diffuseColor.rgb *= mix(1.0, 0.72, waterWetness(vWPos) * uWetOn);` : ``,
              ) +
              sourceAsset7,
      )
      .replace(
        `#include <emissivemap_fragment>`,
        `#include <emissivemap_fragment>
totalEmissiveRadiance += col * ${result2 ? `0.0` : `uEmit[int(vTile + 0.5)]`};`,
      )
      .replace(
        `#include <normal_fragment_maps>`,
        sourceAsset8 +
          String(result2 ? `false` : `true`) +
          sourceAsset9 +
          String(result2 ? `0.0` : `uBump[int(vTile + 0.5)] * uBumpScale * (1.0 - overA)`) +
          sourceAsset10,
      )
      .replace(`#include <aomap_fragment>`, sourceAsset11);
  };
  meshStandardMaterial.customProgramCacheKey = () =>
    `terrain-v7` + (result2 ? `-lip` : ``) + (result3 ? `-wet` : ``);
  meshStandardMaterial.userData.syncAtlas = () => {
    result.uAtlas.value = bumpValue.texture;
    bumpValue.bump.forEach((value6, value7) => (floatBuffer[value7] = value6));
    (bumpValue.seam || []).forEach((value8, value9) => (fillResult[value9] = value8));
    (bumpValue.emit || []).forEach((value10, value11) => (floatBuffer2[value11] = value10));
  };
  return meshStandardMaterial;
}
