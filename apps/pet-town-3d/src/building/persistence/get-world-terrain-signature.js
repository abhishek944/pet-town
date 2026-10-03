/** Serialize, save, restore and reset player block changes. */
import { buildingState } from "../state.js";
export function getWorldTerrainSignature() {
  return [
    buildingState.buildingTerrain?.size,
    buildingState.buildingTerrain?.height,
    buildingState.buildingTerrain?.waterLevel,
    buildingState.buildingTerrain?.spawn &&
      Math.round(buildingState.buildingTerrain.spawn.x) +
        `:` +
        Math.round(buildingState.buildingTerrain.spawn.z),
  ].join(`|`);
}

/** The expanded grid keeps old coordinates and accepts the original island's edit saves. */
export function isCompatibleWorldTerrainSignature(signature) {
  const current = getWorldTerrainSignature();
  if (signature === current) return true;
  if (typeof signature !== "string" || !buildingState.buildingTerrain?.expansion) return false;
  const [savedSize, ...savedShape] = signature.split("|");
  const [currentSize, ...currentShape] = current.split("|");
  return (
    [128, 256, buildingState.buildingTerrain.ocean?.baselineSize].includes(Number(savedSize)) &&
    Number(savedSize) <= Number(currentSize) &&
    savedShape.join("|") === currentShape.join("|")
  );
}
