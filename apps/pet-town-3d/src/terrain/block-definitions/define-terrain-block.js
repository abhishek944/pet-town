/** Texture layer ids, block ids and the built-in terrain block registry. */
import { terrainState } from "../state.js";
export function defineTerrainBlock(value, value2, value3) {
  terrainState.terrainBlockDefinitions[value] = {
    id: value,
    name: value2,
    ...value3,
  };
}
