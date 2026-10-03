/** Vegetation rebuilds, terrain subscriptions, dirty-cell resampling and item removal. */
import { vegetationState } from "../state.js";
export function disposeVegetationFields() {
  if (vegetationState.vegetationRuntimeState.fields) {
    for (let result of Object.values(vegetationState.vegetationRuntimeState.fields)) {
      result.dispose();
    }
  }
  vegetationState.vegetationRuntimeState.fields = null;
  vegetationState.vegetationRuntimeState.terrainHiddenCells = new Map();
  vegetationState.vegetationRuntimeState.registry = new Map();
  vegetationState.vegetationRuntimeState.trees = [];
  vegetationState.vegetationRuntimeState.colliders = [];
  vegetationState.vegetationRuntimeState.floaters = [];
}
