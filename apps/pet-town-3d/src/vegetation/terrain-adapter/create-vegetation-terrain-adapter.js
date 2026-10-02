/** Terrain and block classification, height snapshots, shoreline distances, ocean detection, and ground color sampling. */
import { querySampleColumn } from "./query-sample-column.js";
import { queryWaterLevel } from "./query-water-level.js";
import { queryBiomeName } from "./query-biome-name.js";
import { querySampleCell } from "./query-sample-cell.js";
import { queryClassifyCell } from "./query-classify-cell.js";
import { queryComputeShoreDistance } from "./query-compute-shore-distance.js";
import { queryComputeOceanDistance } from "./query-compute-ocean-distance.js";
import { queryComputeLandDistance } from "./query-compute-land-distance.js";
import { queryComputeWideWater } from "./query-compute-wide-water.js";
import { querySampleAtlasColors } from "./query-sample-atlas-colors.js";
import { queryFallbackGrassColor } from "./query-fallback-grass-color.js";
import { querySampleTerrainColors } from "./query-sample-terrain-colors.js";
import { configureVegetationTerrainBounds } from "./configure-vegetation-terrain-bounds.js";
import { configureVegetationBlockSampling } from "./configure-vegetation-block-sampling.js";
import { createVegetationTerrainSnapshot } from "./create-vegetation-terrain-snapshot.js";
import { installVegetationSnapshotMethods } from "./install-vegetation-snapshot-methods.js";
import { installVegetationColorSampling } from "./install-vegetation-color-sampling.js";
export function createVegetationTerrainAdapter(context) {
  const adapter = {
    context,
  };
  adapter.sampleColumn = (...args) => querySampleColumn(adapter, ...args);
  adapter.waterLevel = (...args) => queryWaterLevel(adapter, ...args);
  adapter.biomeName = (...args) => queryBiomeName(adapter, ...args);
  adapter.sampleCell = (...args) => querySampleCell(adapter, ...args);
  adapter.classifyCell = (...args) => queryClassifyCell(adapter, ...args);
  adapter.computeShoreDistance = (...args) => queryComputeShoreDistance(adapter, ...args);
  adapter.computeOceanDistance = (...args) => queryComputeOceanDistance(adapter, ...args);
  adapter.computeLandDistance = (...args) => queryComputeLandDistance(adapter, ...args);
  adapter.computeWideWater = (...args) => queryComputeWideWater(adapter, ...args);
  adapter.sampleAtlasColors = (...args) => querySampleAtlasColors(adapter, ...args);
  adapter.fallbackGrassColor = (...args) => queryFallbackGrassColor(adapter, ...args);
  adapter.sampleTerrainColors = (...args) => querySampleTerrainColors(adapter, ...args);
  configureVegetationTerrainBounds(adapter);
  configureVegetationBlockSampling(adapter);
  createVegetationTerrainSnapshot(adapter);
  installVegetationSnapshotMethods(adapter);
  installVegetationColorSampling(adapter);
  return adapter.snapshot;
}
