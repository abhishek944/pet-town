/** Public vegetation API for camera fading, wind, clearings, removal, rebuilding and change notification. */

import { vegetationState } from "../state.js";
import { removeVegetationTree } from "../terrain-updates/remove-vegetation-tree.js";
import { hideVegetationItem } from "../terrain-updates/hide-vegetation-item.js";
export function clearVegetationArea(
  position5,
  value9 = 2,
  { trees: value11 = true, small: value12 = true, canopy: value10, transient = false } = {},
) {
  if (!position5) {
    return 0;
  }
  let text = `a:${position5.x.toFixed(2)},${position5.z.toFixed(2)},${value9},${value11},${value12},${value10}`;
  if (!transient && !vegetationState.vegetationRuntimeState.clearLog.has(text))
    vegetationState.vegetationRuntimeState.clearLog.set(text, {
      x: position5.x,
      z: position5.z,
      tr: value11 ? value9 : 0,
      sr: value12 ? value9 : 0,
      canopy: value10,
    });
  if (!vegetationState.vegetationRuntimeState.built) return 0;
  let index = 0;
  if (value11) {
    for (let position6 of [...vegetationState.vegetationRuntimeState.trees]) {
      if (
        Math.hypot(position6.x - position5.x, position6.z - position5.z) <=
        value9 + Math.max(position6.radius, position6.canopyRadius * (value10 ?? 0.55))
      ) {
        removeVegetationTree(position6, false);
        index++;
      }
    }
  }
  if (value12) {
    let ground2 = vegetationState.vegetationRuntimeState.ground;
    let result6 = Math.ceil(value9) + 1;
    for (let result7 = -result6; result7 <= result6; result7++) {
      for (let result8 = -result6; result8 <= result6; result8++) {
        let result9 = vegetationState.vegetationRuntimeState.registry.get(
          ground2.cellOf(position5.x + result8, position5.z + result7),
        );
        if (result9) {
          for (let position7 of result9) {
            if (
              !position7.hidden &&
              !position7.owner &&
              Math.hypot(position7.x - position5.x, position7.z - position5.z) <= value9
            ) {
              hideVegetationItem(position7);
              index++;
            }
          }
        }
      }
    }
  }
  return index;
}
