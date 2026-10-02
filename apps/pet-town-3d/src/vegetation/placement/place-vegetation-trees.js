import { registerVegetationTree } from "./register-vegetation-tree.js";
/** Vegetation clearings, flower palettes and biome-aware world population. */
import * as THREE from "three";
import { vegetationState } from "../state.js";
import { vegetationHash2d } from "../random/vegetation-hash2d.js";
export function placeVegetationTrees(world) {
  for (let candidate of world.orderedTreeCandidates) {
    if (vegetationState.vegetationRuntimeState.trees.length >= world.treeBudget) {
      break;
    }
    if (candidate.kind === `meadow` && world.meadowTreeCount >= world.meadowTreeBudget) {
      continue;
    }
    let cell = candidate.i;
    let [jitterX, jitterZ] = world.cellJitter(cell, 0.24);
    let x = world.cellX(cell) + jitterX;
    let z = world.cellZ(cell) + jitterZ;
    let groundY = world.ground.h[cell];
    let kind = candidate.kind;
    let speciesNoise = vegetationHash2d(cell, 3, world.seed);
    let groveNoise = vegetationHash2d(Math.floor(x / 14), Math.floor(z / 14), world.seed + 77);
    let minimumSpacing =
      kind === `palm`
        ? 3.6
        : world.ground.biome[cell] === vegetationState.vegetationBiomeIds.FOREST
          ? 3.4
          : kind === `pine`
            ? 3
            : 4.4;
    let isMeadow = kind === `meadow`;
    if (
      (kind === `meadow`
        ? ((minimumSpacing = 6.5),
          (kind =
            groveNoise < 0.3
              ? speciesNoise < 0.8
                ? `blossom`
                : `fruit`
              : speciesNoise < 0.38
                ? `fruit`
                : speciesNoise < 0.55
                  ? `blossom`
                  : `oak`))
        : kind === `oak` &&
          world.ground.biome[cell] === vegetationState.vegetationBiomeIds.FOREST &&
          (kind =
            groveNoise < 0.12
              ? `autumn`
              : speciesNoise < 0.3
                ? `pine`
                : speciesNoise < 0.62
                  ? `oakDeep`
                  : `oak`),
      world.isNearTree(x, z, minimumSpacing, true) ||
        world.maximumNearbyHeight(cell, 2) > groundY + 2.5)
    ) {
      continue;
    }
    let variants = vegetationState.vegetationRuntimeState.lib[kind];
    let variantIndex =
      Math.floor(vegetationHash2d(cell, 5, world.seed) * variants.length) % variants.length;
    let geometry = variants[variantIndex];
    let scale = 0.85 + vegetationHash2d(cell, 9, world.seed) * 0.35;
    let heightScale = scale * (0.92 + vegetationHash2d(cell, 10, world.seed) * 0.16);
    let rotation = vegetationHash2d(cell, 11, world.seed) * Math.PI * 2;
    if (
      world.isCleared(x, z, `tree`, {
        radius: geometry.trunkRadius * scale,
        canopyRadius: geometry.canopyRadius * scale,
      })
    ) {
      continue;
    }
    let baseY = groundY - 0.06;
    let brightness = 0.86 + vegetationHash2d(cell, 12, world.seed) * 0.28;
    let warmth = (vegetationHash2d(cell, 14, world.seed) - 0.5) * 0.22;
    let tint = new THREE.Color().setRGB(
      brightness * (1 + warmth * 0.9),
      brightness * (1 + warmth * 0.15),
      brightness * (1 - warmth),
    );
    registerVegetationTree(world, {
      cell,
      x,
      z,
      groundY,
      kind,
      minimumSpacing,
      isMeadow,
      variantIndex,
      geometry,
      scale,
      heightScale,
      rotation,
      baseY,
      tint,
    });
  }
}
