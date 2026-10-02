/** Terrain and block classification, height snapshots, shoreline distances, ocean detection, and ground color sampling. */
import * as THREE from "three";
import { isFiniteTerrainValue } from "./is-finite-terrain-value.js";
export function queryFallbackGrassColor(adapter) {
  let result84 = Array.isArray(adapter.terrain.blocks) ? adapter.terrain.blocks : null;
  let result85 =
    result84 && result84.find((nameValue) => nameValue && /grass/i.test(nameValue.name || ``));
  let result21Result = adapter.sampleAtlasColors();
  if (
    result85 &&
    result21Result &&
    isFiniteTerrainValue(result85.top) &&
    result21Result[result85.top]
  ) {
    return result21Result[result85.top];
  }
  let color2 = new THREE.Color(
    result85 && isFiniteTerrainValue(result85.color) ? result85.color : 7317578,
  );
  return [color2.r, color2.g, color2.b];
}
