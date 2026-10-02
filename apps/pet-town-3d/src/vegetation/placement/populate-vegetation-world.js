/** Vegetation clearings, flower palettes and biome-aware world population. */
import { initializeVegetationPlacement } from "./initialize-vegetation-placement.js";
import { configureVegetationPlacementQueries } from "./configure-vegetation-placement-queries.js";
import { scoreVegetationTreeSites } from "./score-vegetation-tree-sites.js";
import { configureVegetationTreeSpacing } from "./configure-vegetation-tree-spacing.js";
import { placeVegetationTrees } from "./place-vegetation-trees.js";
import { computeVegetationCanopyShade } from "./compute-vegetation-canopy-shade.js";
import { placeVegetationLogs } from "./place-vegetation-logs.js";
import { scoreVegetationBushSites } from "./score-vegetation-bush-sites.js";
import { placeVegetationBushes } from "./place-vegetation-bushes.js";
import { placeVegetationForestFloor } from "./place-vegetation-forest-floor.js";
import { placeVegetationMushrooms } from "./place-vegetation-mushrooms.js";
import { configureVegetationGrassPlacement } from "./configure-vegetation-grass-placement.js";
import { placeVegetationGrass } from "./place-vegetation-grass.js";
import { placeVegetationBorderTufts } from "./place-vegetation-border-tufts.js";
import { placeVegetationFlowers } from "./place-vegetation-flowers.js";
import { placeVegetationWaterPlants } from "./place-vegetation-water-plants.js";
import { publishVegetationPlacementStats } from "./publish-vegetation-placement-stats.js";
export function populateVegetationWorld() {
  const world = {};
  initializeVegetationPlacement(world);
  configureVegetationPlacementQueries(world);
  scoreVegetationTreeSites(world);
  configureVegetationTreeSpacing(world);
  placeVegetationTrees(world);
  computeVegetationCanopyShade(world);
  placeVegetationLogs(world);
  scoreVegetationBushSites(world);
  placeVegetationBushes(world);
  placeVegetationForestFloor(world);
  placeVegetationMushrooms(world);
  configureVegetationGrassPlacement(world);
  placeVegetationGrass(world);
  placeVegetationBorderTufts(world);
  placeVegetationFlowers(world);
  placeVegetationWaterPlants(world);
  publishVegetationPlacementStats(world);
}
