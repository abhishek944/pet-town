import { shapeIslandElevation } from "./shape-island-elevation.js";
import { smoothIslandHeights } from "./smooth-island-heights.js";
import { shapeIslandShoreline } from "./shape-island-shoreline.js";
import { assignIslandBiomes } from "./assign-island-biomes.js";
import { smoothStrataHeights } from "./smooth-strata-heights.js";
import { fillIslandVoxels } from "./fill-island-voxels.js";
import { smoothStrataMaterials } from "./smooth-strata-materials.js";
import { addCliffOutcrops } from "./add-cliff-outcrops.js";
/** Distance-along-polyline sampling and deterministic voxel island generation. */
import { createSimplexNoise } from "../../math/simplex-noise/create-simplex-noise.js";
export function generateIslandTerrain(seed = 7) {
  const island = {
    seed,
  };
  ({ fbm2: island.fbm, noise2: island.noise } = createSimplexNoise(island.seed));
  island.smoothHeights = new Float32Array(16384);
  island.surfaceTypes = new Uint8Array(16384);
  island.biomes = new Uint8Array(16384);
  island.flags = new Uint8Array(16384);
  island.landMask = new Float32Array(16384);
  island.coastMask = new Float32Array(16384);
  shapeIslandElevation(island);
  smoothIslandHeights(island);
  shapeIslandShoreline(island);
  assignIslandBiomes(island);
  smoothStrataHeights(island);
  fillIslandVoxels(island);
  smoothStrataMaterials(island);
  addCliffOutcrops(island);
  return {
    blocks: island.blocks,
    heights: island.heights,
    surf: island.surfaceTypes,
    biome: island.biomes,
    flags: island.flags,
    landMask: island.landMask,
    smoothHeights: island.smoothHeights,
  };
}
