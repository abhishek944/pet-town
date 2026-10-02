/** Terrain and block classification, height snapshots, shoreline distances, ocean detection, and ground color sampling. */
import { vegetationState } from "../state.js";
export function prepareVegetationTerrainAdapter() {
  vegetationState.vegetationBiomeIds = {
    MEADOW: 0,
    FOREST: 1,
    BEACH: 2,
    MOUNTAIN: 3,
    SNOW: 4,
    DESERT: 5,
    SWAMP: 6,
    TOWN: 7,
    WATER: 8,
    HILLS: 9,
  };
  vegetationState.vegetationSurfaceIds = {
    GRASS: 0,
    SAND: 1,
    STONE: 2,
    SNOW: 3,
    WATER: 4,
    DIRT: 5,
    OTHER: 6,
  };
  vegetationState.vegetationNonSolidBlockPattern =
    /air|empty|none|leaf|leaves|flower|grass_?tuft|plant|torch|water/;
}
