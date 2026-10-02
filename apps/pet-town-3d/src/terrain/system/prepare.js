/** Editable terrain lifecycle, chunks, water masks, raycasting, custom blocks, block icons and lighting updates. */
import { terrainState } from "../state.js";
import { initializeTerrain } from "./initialize-terrain.js";
import { updateTerrain } from "./update-terrain.js";
export function prepareTerrainSystem() {
  terrainState.terrainSystem = {
    get CHUNK() {
      return 16;
    },
    get MAXH() {
      return terrainState.terrainWorldHeight;
    },
    get SIZE() {
      return terrainState.terrainWorldSize;
    },
    get WATER_LEVEL() {
      return terrainState.terrainWaterLevel;
    },
    get init() {
      return initializeTerrain;
    },
    get update() {
      return updateTerrain;
    },
  };
  terrainState.terrainWorldSize = 128;
  terrainState.terrainWorldHeight = 40;
}
