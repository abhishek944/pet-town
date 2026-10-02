/** Guarded initialization and per-frame vegetation updates including props, water bobbing, quality and wind. */
import { vegetationState } from "../state.js";
import { vegetationClearVegetationAroundProps } from "./vegetation-clear-vegetation-around-props.js";
export function updateVegetationWaterInteraction(frame) {
  frame.uniforms = vegetationState.vegetationRuntimeState.shared;
  frame.api = frame.context.vegetation;
  frame.waterHeight = frame.context.water?.sample;
  if (
    typeof frame.waterHeight == `function` &&
    vegetationState.vegetationRuntimeState.floaters.length
  ) {
    for (let position3 of vegetationState.vegetationRuntimeState.floaters) {
      if (position3.hidden) {
        continue;
      }
      let result2;
      try {
        result2 = frame.waterHeight.call(frame.context.water, position3.x, position3.z);
      } catch {
        result2 = NaN;
      }
      if (Number.isFinite(result2)) {
        position3.y = result2 + 0.05;
        position3.field.update(position3);
      }
    }
  }
  if (
    (vegetationState.vegetationRuntimeState.built &&
      vegetationClearVegetationAroundProps(frame.context),
    vegetationState.vegetationRuntimeState.built &&
      !vegetationState.vegetationRuntimeState.layerApplied &&
      frame.context.water)
  ) {
    let NO_REFLECT_LAYER2 = frame.context.water.NO_REFLECT_LAYER;
    if (Number.isInteger(NO_REFLECT_LAYER2) && NO_REFLECT_LAYER2 >= 0 && NO_REFLECT_LAYER2 < 32) {
      frame.context.camera?.layers.enable(NO_REFLECT_LAYER2);
      for (let result3 of vegetationState.vegetationRuntimeState.group.children) {
        let reflect2 = result3.userData.reflect;
        if (
          reflect2 === `never` ||
          (reflect2 === `nearWater` && !result3.userData.nearWater) ||
          result3.material === vegetationState.vegetationRuntimeState.materials.blob
        ) {
          result3.layers.set(NO_REFLECT_LAYER2);
        }
      }
      vegetationState.vegetationRuntimeState.layerApplied = true;
    }
  }
}
