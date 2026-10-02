/** Block selection outlines, face textures and physical materials. */
import * as THREE from "three";
import { buildingState } from "../state.js";
import { createBlockFaceTexture } from "./create-block-face-texture.js";
export function createBlockMaterials(key, { ghost = false, skin = false } = {}) {
  let cacheKey = key + (ghost ? `:g` : skin ? `:s` : ``);
  if (buildingState.blockMaterialCache.has(cacheKey)) {
    return buildingState.blockMaterialCache.get(cacheKey);
  }
  let emissive = !!(
    buildingState.resolvedBuildingPalette.find((block) => block.key === key) ??
    buildingState.resolvedBuildingPalette[0]
  ).emissive;
  let createFaceMaterial = (face) =>
    new THREE.MeshStandardMaterial({
      map: createBlockFaceTexture(key, face),
      roughness: key === `glass` ? 0.25 : 0.9,
      metalness: 0,
      transparent: ghost,
      opacity: ghost ? 0.62 : 1,
      depthWrite: !ghost,
      emissive: new THREE.Color(emissive ? `#ffb347` : ghost ? `#ffffff` : `#000000`),
      emissiveIntensity: emissive ? (face === `side` ? 1.1 : 0.5) : ghost ? 0.5 : 0,
      emissiveMap: emissive || ghost ? createBlockFaceTexture(key, face) : null,
      polygonOffset: !ghost,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -2,
    });
  let sideMaterial = createFaceMaterial(`side`);
  let materials = [
    sideMaterial,
    sideMaterial,
    createFaceMaterial(`top`),
    createFaceMaterial(`bottom`),
    sideMaterial,
    sideMaterial,
  ];
  buildingState.blockMaterialCache.set(cacheKey, materials);
  return materials;
}
