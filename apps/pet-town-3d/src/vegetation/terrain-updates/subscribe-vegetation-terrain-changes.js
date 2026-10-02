/** Vegetation rebuilds, terrain subscriptions, dirty-cell resampling and item removal. */
import { vegetationState } from "../state.js";
import { markVegetationTerrainDirty } from "./mark-vegetation-terrain-dirty.js";
export function subscribeVegetationTerrainChanges(terrainValue) {
  let terrain2 = terrainValue.terrain;
  if (!terrain2 || vegetationState.vegetationRuntimeState.subscribedTo === terrain2) {
    return;
  }
  vegetationState.vegetationRuntimeState.subscribedTo = terrain2;
  let callback = (value) => markVegetationTerrainDirty(value);
  try {
    if (
      ((vegetationState.vegetationRuntimeState.fineEvents = false),
      typeof terrain2.onChange == `function`)
    ) {
      if (terrain2.onChange.length >= 1 || /\.\.\./.test(String(terrain2.onChange).slice(0, 120))) {
        terrain2.onChange(callback);
        vegetationState.vegetationRuntimeState.fineEvents = true;
      }
    } else if (Array.isArray(terrain2.onChange)) {
      terrain2.onChange.push(callback);
      vegetationState.vegetationRuntimeState.fineEvents = true;
    } else if (
      (terrain2.onChange === undefined || terrain2.onChange === null) &&
      typeof terrain2.setBlock == `function` &&
      !terrain2.setBlock.__vegWrapped
    ) {
      let setBlock2 = terrain2.setBlock;
      let callback2 = function (value2, value3, value4, ...value5) {
        let callResult = setBlock2.call(this, value2, value3, value4, ...value5);
        try {
          callback({
            x: value2,
            y: value3,
            z: value4,
          });
        } catch {}
        return callResult;
      };
      callback2.__vegWrapped = true;
      terrain2.setBlock = callback2;
      vegetationState.vegetationRuntimeState.fineEvents = true;
    }
    if (typeof terrain2.addEventListener == `function`) {
      terrain2.addEventListener(`change`, (detailValue) =>
        callback(detailValue?.detail ?? detailValue),
      );
    }
    if (typeof terrain2.on == `function`) {
      terrain2.on(`change`, callback);
    }
  } catch (result) {
    console.warn(`[vegetation] terrain subscribe failed`, result);
  }
}
