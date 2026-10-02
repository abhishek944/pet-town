/** Cached baked species rigs and independent skeleton cloning. */
import { creaturesState } from "../state.js";
export function prepareCreaturesPrefabs() {
  creaturesState.creaturePrefabCache = new Map();
}
