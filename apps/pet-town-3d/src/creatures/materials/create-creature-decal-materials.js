/** Shared creature materials, fur shading, emissive variants and day-night lighting. */
import * as THREE from "three";
import { createCreatureCanvasTexture } from "./create-creature-canvas-texture.js";
export function createCreatureDecalMaterials() {
  let blushTexture = createCreatureCanvasTexture(64, 64, (painter, value, value2) => {
    let radialGradientResult = painter.createRadialGradient(
      value / 2,
      value2 / 2,
      0,
      value / 2,
      value2 / 2,
      value / 2,
    );
    radialGradientResult.addColorStop(0, `rgba(255,255,255,0.95)`);
    radialGradientResult.addColorStop(0.55, `rgba(255,255,255,0.65)`);
    radialGradientResult.addColorStop(1, `rgba(255,255,255,0)`);
    painter.fillStyle = radialGradientResult;
    painter.fillRect(0, 0, value, value2);
  });
  let blushCache = new Map();
  let blush = (value3 = 16744345) => {
    let result = blushCache.get(value3);
    if (!result) {
      result = new THREE.MeshBasicMaterial({
        map: blushTexture,
        color: value3,
        transparent: true,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -2,
        polygonOffsetUnits: -2,
      });
      result.userData.isBlush = true;
      blushCache.set(value3, result);
    }
    return result;
  };
  let shadow = new THREE.MeshBasicMaterial({
    map: createCreatureCanvasTexture(128, 128, (painter2, value4, value5) => {
      let radialGradientResult2 = painter2.createRadialGradient(
        value4 / 2,
        value5 / 2,
        0,
        value4 / 2,
        value5 / 2,
        value4 / 2,
      );
      radialGradientResult2.addColorStop(0, `rgba(20,30,40,0.55)`);
      radialGradientResult2.addColorStop(0.45, `rgba(20,30,40,0.35)`);
      radialGradientResult2.addColorStop(1, `rgba(20,30,40,0)`);
      painter2.fillStyle = radialGradientResult2;
      painter2.fillRect(0, 0, value4, value5);
    }),
    transparent: true,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -4,
    polygonOffsetUnits: -4,
  });
  return {
    blush,
    shadow,
  };
}
