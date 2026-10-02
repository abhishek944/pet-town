import { createCreatureDecalMaterials } from "./create-creature-decal-materials.js";
import { createCreatureEmissiveMaterials } from "./create-creature-emissive-materials.js";
/** Shared creature materials, fur shading, emissive variants and day-night lighting. */
import * as THREE from "three";
import { creaturesState } from "../state.js";
import { applyCreatureStylizedShading } from "./apply-creature-stylized-shading.js";
import { createCreatureVertexMaterial } from "./create-creature-vertex-material.js";
import { createCreatureCanvasTexture } from "./create-creature-canvas-texture.js";
export function getCreatureMaterials() {
  if (creaturesState.creatureMaterials) {
    return creaturesState.creatureMaterials;
  }
  let body = applyCreatureStylizedShading(
    createCreatureVertexMaterial({
      roughness: 0.82,
    }),
    {
      rim: 0.3,
      lift: 0.08,
      key: `body`,
    },
  );
  let glossy = applyCreatureStylizedShading(
    createCreatureVertexMaterial({
      roughness: 0.4,
    }),
    {
      rim: 0.3,
      lift: 0.07,
      ramp: 0.5,
      key: `glossy`,
    },
  );
  let fluff = applyCreatureStylizedShading(
    createCreatureVertexMaterial({
      roughness: 0.95,
    }),
    {
      rim: 0.35,
      power: 2.4,
      tint: 0.75,
      lift: 0.12,
      ramp: 0.55,
      fur: 0.55,
      furScale: 42,
      key: `fluff`,
    },
  );
  let eye = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.12,
    metalness: 0,
  });
  let white = new THREE.MeshBasicMaterial({
    color: 16777215,
    toneMapped: false,
  });
  let ink = new THREE.MeshBasicMaterial({
    color: 3809832,
  });
  let jelly = applyCreatureStylizedShading(
    createCreatureVertexMaterial({
      roughness: 0.28,
      transparent: true,
      opacity: 0.92,
      depthWrite: false,
    }),
    {
      rim: 0.5,
      power: 2,
      tint: 0.6,
      lift: 0.2,
      ramp: 0.45,
      key: `jelly`,
    },
  );
  let crystal = applyCreatureStylizedShading(
    createCreatureVertexMaterial({
      roughness: 0.2,
      metalness: 0.05,
      flatShading: true,
      emissive: 2775664,
      emissiveIntensity: 0.5,
    }),
    {
      rim: 0.5,
      lift: 0.15,
      ramp: 0.3,
      key: `crystal`,
    },
  );
  let glow = new THREE.MeshBasicMaterial({
    vertexColors: true,
    toneMapped: false,
  });
  let blush, shadow;
  ({ blush, shadow } = createCreatureDecalMaterials.call(this));
  let bodyLum, fluffLum, heart, uber, inner;
  ({ bodyLum, fluffLum, heart, uber, inner } = createCreatureEmissiveMaterials.call(this));
  creaturesState.creatureMaterials = {
    body: body,
    glossy: glossy,
    fluff: fluff,
    eye: eye,
    white: white,
    ink: ink,
    jelly: jelly,
    crystal: crystal,
    glow: glow,
    blush: blush,
    shadow: shadow,
    canvasTex: createCreatureCanvasTexture,
    bodyLum: bodyLum,
    fluffLum: fluffLum,
    heart: heart,
    uber: uber,
    inner: inner,
  };
  creaturesState.creatureMaterials.stylized = [
    body,
    glossy,
    fluff,
    jelly,
    crystal,
    bodyLum,
    fluffLum,
    heart,
    uber,
    inner,
  ];
  return creaturesState.creatureMaterials;
}
