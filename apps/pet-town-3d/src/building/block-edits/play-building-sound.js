/** Block edit feedback and canonical block-state application. */
import { buildingState } from "../state.js";
export let playBuildingSound = (value, value2) => {
  try {
    buildingState.buildingContext.audio?.sfx?.(value, value2);
  } catch {}
};
