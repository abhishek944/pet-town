/** Block edit feedback and canonical block-state application. */
import { buildingState } from "../state.js";
export let showBuildingToast = (value, value2) => {
  try {
    buildingState.buildingContext.hud?.toast?.(value, value2);
  } catch {}
};
