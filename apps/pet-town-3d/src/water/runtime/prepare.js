/** Water lifecycle, terrain rebaking, dynamic reflections/refraction, ripples, splashes, and public water API. */
import { waterState } from "../state.js";
import { initializeWaterSystem } from "./initialize-water-system.js";
import { updateWaterSystem } from "./update-water-system.js";
export function prepareWaterRuntime() {
  waterState.waterSystem = {
    get init() {
      return initializeWaterSystem;
    },
    get update() {
      return updateWaterSystem;
    },
  };
  waterState.waterIntegerLevelInset = 0.12;
  waterState.waterRuntimeState = null;
}
