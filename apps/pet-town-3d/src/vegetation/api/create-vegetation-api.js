import { clearVegetationBox } from "./clear-vegetation-box.js";
import { clearVegetationArea } from "./clear-vegetation-area.js";
import { setVegetationCameraFade } from "./set-vegetation-camera-fade.js";
/** Public vegetation API for camera fading, wind, clearings, removal, rebuilding and change notification. */
import * as THREE from "three";
import { vegetationState } from "../state.js";
import { removeVegetationTree } from "../terrain-updates/remove-vegetation-tree.js";
import { markVegetationTerrainDirty } from "../terrain-updates/mark-vegetation-terrain-dirty.js";
export function createVegetationApi(value2) {
  let shared2 = vegetationState.vegetationRuntimeState.shared;
  let point = new THREE.Vector2(shared2.uWind.value.x, shared2.uWind.value.y);
  return {
    get trees() {
      return vegetationState.vegetationRuntimeState.trees;
    },
    get colliders() {
      return vegetationState.vegetationRuntimeState.colliders;
    },
    get canopies() {
      if (!vegetationState.vegetationRuntimeState.canopies) {
        vegetationState.vegetationRuntimeState.canopies =
          vegetationState.vegetationRuntimeState.trees.flatMap(
            (canopiesValue) => canopiesValue.canopies || [],
          );
      }
      return vegetationState.vegetationRuntimeState.canopies;
    },
    setCameraFade(...args) {
      return setVegetationCameraFade.apply(this, args);
    },
    sway: {
      get strength() {
        return shared2.uWind.value.z;
      },
      set strength(value4) {
        shared2.uWind.value.z = value4;
      },
      get gust() {
        return shared2.uGust.value;
      },
      set gust(value5) {
        shared2.uGust.value = value5;
        vegetationState.vegetationRuntimeState.userGust = true;
      },
      direction: point,
      speed: 1,
      uniforms: shared2,
      at(value6, value7, copyValue = new THREE.Vector2()) {
        let normalizeResult = point.clone().normalize();
        let windTime2 = vegetationState.vegetationRuntimeState.windTime;
        let result2 = value6 * normalizeResult.x + value7 * normalizeResult.y;
        let result3 = 0.5 + 0.5 * Math.sin(result2 * 0.07 * 6.28 - windTime2 * 0.55 * 6.28);
        return copyValue
          .copy(normalizeResult)
          .multiplyScalar((0.35 + result3 * 1.4) * shared2.uWind.value.z);
      },
    },
    pushers: [],
    group: vegetationState.vegetationRuntimeState.group,
    get stats() {
      return vegetationState.vegetationRuntimeState.stats;
    },
    removeTreeNear(position4, value8 = 2.5) {
      if (!position4) {
        return null;
      }
      let result4 = null;
      let value8Value = value8;
      for (let result5 of vegetationState.vegetationRuntimeState.trees) {
        let hypotResult = Math.hypot(
          result5.position.x - position4.x,
          result5.position.z - position4.z,
        );
        if (hypotResult <= value8Value) {
          value8Value = hypotResult;
          result4 = result5;
        }
      }
      return result4 ? removeVegetationTree(result4, true) : null;
    },
    clearArea(...args) {
      return clearVegetationArea.apply(this, args);
    },
    clearBox(...args) {
      return clearVegetationBox.apply(this, args);
    },
    rebuild() {
      vegetationState.vegetationRuntimeState.rebuildAt =
        vegetationState.vegetationRuntimeState.ctx.time;
    },
    _debugState: () => vegetationState.vegetationRuntimeState,
    notifyChange(value21, value22, value23) {
      markVegetationTerrainDirty({
        x: value21,
        y: value22,
        z: value23,
      });
    },
  };
}
