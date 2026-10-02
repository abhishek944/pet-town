/** Serialize, save, restore and reset player block changes. */
import { buildingState } from "../state.js";
export function deserializeBuildingBlockState(savedKey) {
  if (savedKey === `air`) {
    return {
      id: buildingState.buildingRuntime.airId,
      skin: null,
    };
  }
  if (typeof savedKey == `string` && savedKey.startsWith(`tid:`)) {
    let numberResult = Number(savedKey.slice(4));
    return Number.isFinite(numberResult)
      ? {
          id: numberResult,
          skin: null,
        }
      : null;
  }
  let Result = buildingState.resolvedBuildingPalette.find((keyValue) => keyValue.key === savedKey);
  return Result?.available
    ? {
        id: Result.resolvedId,
        skin: Result.skin,
      }
    : null;
}
