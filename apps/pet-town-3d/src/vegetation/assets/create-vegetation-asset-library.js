/** Cell registration and construction of the procedural vegetation asset and field libraries. */
import { createVegetationLeafMaterials } from "./create-vegetation-leaf-materials.js";
import { createVegetationStemMaterials } from "./create-vegetation-stem-materials.js";
import { createVegetationWaterMaterials } from "./create-vegetation-water-materials.js";
import { createVegetationGroundCoverAssets } from "./create-vegetation-ground-cover-assets.js";
import { createVegetationTreeAssets } from "./create-vegetation-tree-assets.js";
import { createVegetationUndergrowthAssets } from "./create-vegetation-undergrowth-assets.js";
export function createVegetationAssetLibrary() {
  const assets = {};
  createVegetationLeafMaterials(assets);
  createVegetationStemMaterials(assets);
  createVegetationWaterMaterials(assets);
  // Compile the fade variant during loading, not the first time the player
  // walks beneath a canopy (which used to invalidate twelve materials at once).
  for (const name of [
    "foliage", "blossom", "autumn", "pine", "fringe", "fringeBlossom",
    "fringeAutumn", "fringePine", "bush", "fringeBush", "trunk", "frond",
  ]) {
    const material = assets.materials[name]?.mat;
    if (material) material.defines = { ...material.defines, VEG_FADE: "" };
  }
  createVegetationGroundCoverAssets(assets);
  createVegetationTreeAssets(assets);
  createVegetationUndergrowthAssets(assets);
}
