/** Vegetation clearings, flower palettes and biome-aware world population. */
import { vegetationState } from "../state.js";
export function collectVegetationClearings() {
  let values2 = [];
  let clearings2 = vegetationState.vegetationRuntimeState.ctx.props?.clearings;
  if (Array.isArray(clearings2)) {
    for (let position of clearings2) {
      if (position && Number.isFinite(position.x) && Number.isFinite(position.z)) {
        values2.push({
          x: position.x,
          z: position.z,
          tr: Number.isFinite(position.radius) ? position.radius : 0,
          sr: Number.isFinite(position.small)
            ? position.small
            : Number.isFinite(position.radius)
              ? position.radius
              : 0,
        });
      }
    }
  }
  for (let result of vegetationState.vegetationRuntimeState.clearLog.values()) {
    values2.push(result);
  }
  return values2;
}
