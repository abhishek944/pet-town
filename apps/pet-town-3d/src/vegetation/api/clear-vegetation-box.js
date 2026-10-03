/** Public vegetation API for camera fading, wind, clearings, removal, rebuilding and change notification. */

import { vegetationState } from "../state.js";
import { removeVegetationTree } from "../terrain-updates/remove-vegetation-tree.js";
import { hideVegetationItem } from "../terrain-updates/hide-vegetation-item.js";
export function clearVegetationBox(
  value13,
  value14,
  value15,
  value16,
  value17 = 0.4,
  { transient = false } = {},
) {
  let text2 = `b:${value13},${value14},${value15},${value16},${value17}`;
  if (!transient && !vegetationState.vegetationRuntimeState.clearLog.has(text2))
    vegetationState.vegetationRuntimeState.clearLog.set(text2, {
      box: [value13, value14, value15, value16, value17],
      trees: true,
      small: true,
    });
  if (!vegetationState.vegetationRuntimeState.built) return 0;
  let index2 = 0;
  let callback = (value18, value19, value20) =>
    value18 >= value13 - value20 &&
    value18 <= value15 + value20 &&
    value19 >= value14 - value20 &&
    value19 <= value16 + value20;
  for (let position8 of [...vegetationState.vegetationRuntimeState.trees]) {
    if (callback(position8.x, position8.z, value17 + position8.radius + 0.6)) {
      removeVegetationTree(position8, false);
      index2++;
    }
  }
  let ground3 = vegetationState.vegetationRuntimeState.ground;
  for (
    let result10 = Math.floor(value14 - value17 - 2);
    result10 <= Math.ceil(value16 + value17 + 2);
    result10++
  ) {
    for (
      let result11 = Math.floor(value13 - value17 - 2);
      result11 <= Math.ceil(value15 + value17 + 2);
      result11++
    ) {
      let result12 = vegetationState.vegetationRuntimeState.registry.get(
        ground3.cellOf(result11 + 0.5, result10 + 0.5),
      );
      if (result12) {
        for (let position9 of result12) {
          if (
            !position9.hidden &&
            !position9.owner &&
            callback(
              position9.x,
              position9.z,
              value17 +
                (position9.field.o.kind === `bush`
                  ? 0.8
                  : position9.field.o.kind === `log`
                    ? 1.4
                    : 0.1),
            )
          ) {
            hideVegetationItem(position9);
            index2++;
          }
        }
      }
    }
  }
  return index2;
}
