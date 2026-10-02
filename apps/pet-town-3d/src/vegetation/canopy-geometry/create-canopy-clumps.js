/** Canopy surface intersections, rounded clumps and silhouette fringe cards. */
import { configureCanopyClumps } from "./configure-canopy-clumps.js";
import { configureCanopyVertexShading } from "./configure-canopy-vertex-shading.js";
import { buildCanopyClumpSurfaces } from "./build-canopy-clump-surfaces.js";
import { buildCanopyFringeGeometry } from "./build-canopy-fringe-geometry.js";
export function createCanopyClumps(random, clumps, center, radius, settings = {}) {
  const canopy = {
    random,
    clumps,
    center,
    radius,
    settings,
  };
  configureCanopyClumps(canopy);
  configureCanopyVertexShading(canopy);
  buildCanopyClumpSurfaces(canopy);
  buildCanopyFringeGeometry(canopy);
  return {
    parts: canopy.parts,
    fringe: canopy.fringe,
  };
}
