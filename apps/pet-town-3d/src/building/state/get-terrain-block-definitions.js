/** Building API module, hotbar state, history queues, skin assignments and terrain resolution. */
import { buildingState } from "../state.js";
export function getTerrainBlockDefinitions() {
  let result =
    buildingState.buildingTerrain?.blockTypes ??
    (Array.isArray(buildingState.buildingTerrain?.blocks)
      ? buildingState.buildingTerrain.blocks
      : null) ??
    buildingState.buildingTerrain?.BLOCK ??
    buildingState.buildingTerrain?.blocks ??
    buildingState.buildingTerrain?.types;
  if (!result || typeof result != `object`) {
    return null;
  }
  let values = [];
  let callback = (value, value2, value3) => {
    value = Number(value);
    if (Number.isFinite(value) && value2 != null) {
      values.push({
        id: value,
        name: String(value2),
        def: value3,
      });
    }
  };
  if (result instanceof Map) {
    for (let [result2, result3] of result) {
      if (typeof result3 == `number`) {
        callback(result3, result2);
      } else {
        callback(
          typeof result2 == `number` ? result2 : result3?.id,
          result3?.key ?? result3?.name ?? result2,
          result3,
        );
      }
    }
  } else if (Array.isArray(result)) {
    result.forEach((idValue, value4) => {
      if (idValue != null) {
        if (typeof idValue == `string`) {
          callback(value4, idValue);
        } else {
          if (typeof idValue == `object`) {
            callback(idValue.id ?? value4, idValue.key ?? idValue.name ?? idValue.type, idValue);
          }
        }
      }
    });
  } else {
    for (let [result4, result5] of Object.entries(result)) {
      if (typeof result5 == `number`) {
        callback(result5, result4);
      } else {
        if (typeof result5 == `string`) {
          callback(result4, result5);
        } else {
          if (result5 && typeof result5 == `object`) {
            callback(result5.id ?? result4, result5.key ?? result5.name ?? result4, result5);
          }
        }
      }
    }
  }
  return values.length ? values : null;
}
