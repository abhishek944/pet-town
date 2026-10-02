/** Creature system namespace, world state, terrain queries, obstruction checks and nearby effects. */
import { creaturesState } from "../state.js";
import { getCreatureTreeSpatialIndex } from "./get-creature-tree-spatial-index.js";
export function isCreaturePositionBlocked(value, value2, value3 = 0, value4 = null) {
  let props2 = creaturesState.creaturesRuntime.ctx.props;
  try {
    if (props2?.colliders && value4 != null) {
      for (let position2 of props2.colliders) {
        if (
          Math.hypot(position2.x - value, position2.z - value2) < position2.radius + value3 &&
          value4 < (position2.y0 ?? -1e9) + (position2.h ?? 1e9) &&
          value4 + 0.6 > (position2.y0 ?? -1e9)
        ) {
          return true;
        }
      }
    } else if (props2?.isBlocked?.(value, value2, value3)) {
      return true;
    }
  } catch {}
  let creatureTreeSpatialIndexResult = getCreatureTreeSpatialIndex();
  if (creatureTreeSpatialIndexResult) {
    let result = Math.floor(value / 4);
    let result2 = Math.floor(value2 / 4);
    for (let result3 = -1; result3 <= 1; result3++) {
      for (let result4 = -1; result4 <= 1; result4++) {
        let result5 = creatureTreeSpatialIndexResult.get(
          result + result3 + `,` + (result2 + result4),
        );
        if (result5) {
          for (let result6 of result5) {
            let result7 = Math.min(0.9, (result6.radius ?? 0.5) * 0.8);
            if (
              Math.hypot(result6.position.x - value, result6.position.z - value2) <
                result7 + value3 &&
              (value4 == null || value4 < result6.position.y + (result6.height ?? 4) * 0.55)
            ) {
              return true;
            }
          }
        }
      }
    }
  }
  return false;
}
