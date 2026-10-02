import { applyCreatureStylizedShading } from "./apply-creature-stylized-shading.js";
import { createCreatureVertexMaterial } from "./create-creature-vertex-material.js";
export function createCreatureEmissiveMaterials() {
  let bodyLum = applyCreatureStylizedShading(
    createCreatureVertexMaterial({
      roughness: 0.82,
    }),
    {
      rim: 0.3,
      lift: 0.08,
      key: `bodyLum`,
    },
  );
  let fluffLum = applyCreatureStylizedShading(
    createCreatureVertexMaterial({
      roughness: 0.95,
    }),
    {
      rim: 0.35,
      power: 2.4,
      tint: 0.75,
      lift: 0.12,
      ramp: 0.55,
      fur: 0.45,
      furScale: 55,
      key: `fluffLum`,
    },
  );
  let heart = applyCreatureStylizedShading(
    createCreatureVertexMaterial({
      roughness: 0.3,
    }),
    {
      rim: 0.3,
      lift: 0.1,
      ramp: 0.4,
      key: `heart`,
    },
  );
  let uber = applyCreatureStylizedShading(
    createCreatureVertexMaterial({
      roughness: 0.8,
    }),
    {
      rim: 0.3,
      power: 2.4,
      tint: 0.75,
      lift: 0.085,
      ramp: 0.55,
      furScale: 42,
      key: `uber`,
      uber: true,
    },
  );
  let inner = applyCreatureStylizedShading(
    createCreatureVertexMaterial({
      roughness: 0.35,
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
      emissive: 4198432,
      emissiveIntensity: 0.25,
    }),
    {
      rim: 0.2,
      lift: 0.18,
      ramp: 0.3,
      key: `inner`,
    },
  );
  return {
    bodyLum,
    fluffLum,
    heart,
    uber,
    inner,
  };
}
