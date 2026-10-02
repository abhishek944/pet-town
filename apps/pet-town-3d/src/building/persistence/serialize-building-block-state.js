/** Serialize, save, restore and reset player block changes. */
import { buildingState } from "../state.js";
export function serializeBuildingBlockState(blockState) {
  if (!blockState.id || blockState.id === buildingState.buildingRuntime.airId) {
    return `air`;
  }
  if (blockState.skin) {
    return blockState.skin;
  }
  let Result = buildingState.resolvedBuildingPalette.find(
    (nativeValue) => nativeValue.native && nativeValue.resolvedId === blockState.id,
  );
  return Result ? Result.key : `tid:` + blockState.id;
}
