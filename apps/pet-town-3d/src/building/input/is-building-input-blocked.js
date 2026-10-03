/** Input guards, cursor art and desktop/touch building event bindings. */
import { buildingState } from "../state.js";
export function isBuildingInputBlocked() {
  return (
    !buildingState.buildingRuntime.enabled ||
    buildingState.buildingContext.boats?.aboard ||
    buildingState.buildingContext.hud?.blocking ||
    Boolean(buildingState.buildingContext.petTown?.controller?.selected) ||
    buildingState.buildingContext.petTown?.panel?.open ||
    buildingState.buildingContext.paused ||
    buildingState.buildingContext.petTown?.terminal?.inputActive ||
    (buildingState.worldPersistenceState.on && !buildingState.worldPersistenceState.loaded)
  );
}
