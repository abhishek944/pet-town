/** Front-facing and cursor targets, ghost placement visualization and lantern light updates. */
import { buildingState } from "../state.js";
import { getBuildingNightAmount } from "./get-building-night-amount.js";
import { readTerrainBlock } from "../terrain-adapter/read-terrain-block.js";
export function updatePlacedLanterns(deltaTime) {
  if ((buildingState.lanternUpdateAccumulator += deltaTime) < 0.2) {
    return;
  }
  deltaTime = buildingState.lanternUpdateAccumulator;
  buildingState.lanternUpdateAccumulator = 0;
  let buildingNightAmountResult = getBuildingNightAmount();
  let resolvedId2 = buildingState.resolvedBuildingPalette.find(
    (keyValue) => keyValue.key === `lantern`,
  )?.resolvedId;
  for (let result2 of buildingState.placedLanternCoordinates) {
    let [result3, result4, result5] = result2.split(`,`).map(Number);
    if (readTerrainBlock(result3, result4, result5) !== resolvedId2) {
      buildingState.placedLanternCoordinates.delete(result2);
    }
  }
  let position2 =
    buildingState.buildingContext.player?.position ?? buildingState.buildingContext.camera.position;
  let sortResult = [...buildingState.placedLanternCoordinates]
    .map((splitValue) => splitValue.split(`,`).map(Number))
    .sort(
      (value2, value3) =>
        Math.hypot(value2[0] - position2.x, value2[1] - position2.y, value2[2] - position2.z) -
        Math.hypot(value3[0] - position2.x, value3[1] - position2.y, value3[2] - position2.z),
    );
  buildingState.placedLanternLights.forEach((positionValue, value4) => {
    let result6 = sortResult[value4];
    let result7 = result6 ? 2.5 + 9 * buildingNightAmountResult : 0;
    if (result6) {
      positionValue.position.set(result6[0] + 0.5, result6[1] + 0.6, result6[2] + 0.5);
    }
    positionValue.intensity += (result7 - positionValue.intensity) * (1 - Math.exp(-deltaTime * 4));
  });
  let result = buildingState.blockMaterialCache.get(`lantern:s`);
  if (result) {
    for (let result8 of result) {
      result8.emissiveIntensity =
        (result8 === result[0] ? 1 : 0.5) * (0.8 + 0.9 * buildingNightAmountResult);
    }
  }
}
