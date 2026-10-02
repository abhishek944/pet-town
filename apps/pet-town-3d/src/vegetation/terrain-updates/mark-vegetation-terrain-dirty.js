/** Vegetation rebuilds, terrain subscriptions, dirty-cell resampling and item removal. */
import { vegetationState } from "../state.js";
export function markVegetationTerrainDirty(value) {
  if (!vegetationState.vegetationRuntimeState.built) {
    vegetationState.vegetationRuntimeState.rebuildAt =
      vegetationState.vegetationRuntimeState.ctx.time + 0.2;
    return;
  }
  let ground2 = vegetationState.vegetationRuntimeState.ground;
  let callback = (value2) => typeof value2 == `number` && Number.isFinite(value2);
  let callback2 = (value3, value4) => {
    for (let result = -1; result <= 1; result++) {
      for (let result2 = -1; result2 <= 1; result2++) {
        let cellOfResult = ground2.cellOf(value3 + result2, value4 + result);
        if (cellOfResult >= 0) {
          vegetationState.vegetationRuntimeState.dirty.add(cellOfResult);
        }
      }
    }
  };
  let valueValue = value;
  if (
    (Array.isArray(valueValue) &&
      valueValue.length >= 3 &&
      callback(valueValue[0]) &&
      (valueValue = {
        x: valueValue[0],
        y: valueValue[1],
        z: valueValue[2],
      }),
    valueValue && callback(valueValue.x) && callback(valueValue.z))
  ) {
    callback2(valueValue.x, valueValue.z);
    return;
  }
  if (valueValue && valueValue.position && callback(valueValue.position.x)) {
    callback2(valueValue.position.x, valueValue.position.z);
    return;
  }
  let position2 = valueValue && (valueValue.min || valueValue.box?.min);
  let position3 = valueValue && (valueValue.max || valueValue.box?.max);
  if (
    position2 &&
    position3 &&
    callback(position2.x) &&
    callback(position3.x) &&
    (position3.x - position2.x + 1) * (position3.z - position2.z + 1) <= 4096
  ) {
    for (let result3 = Math.floor(position2.z); result3 <= Math.ceil(position3.z); result3++) {
      for (let result4 = Math.floor(position2.x); result4 <= Math.ceil(position3.x); result4++) {
        callback2(result4 + 0.5, result3 + 0.5);
      }
    }
    return;
  }
  if (Array.isArray(valueValue)) {
    for (let result5 of valueValue) {
      markVegetationTerrainDirty(result5);
    }
    return;
  }
  vegetationState.vegetationRuntimeState.rebuildAt =
    vegetationState.vegetationRuntimeState.ctx.time + 0.25;
}
