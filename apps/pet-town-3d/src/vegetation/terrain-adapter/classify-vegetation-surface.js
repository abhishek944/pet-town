/** Terrain and block classification, height snapshots, shoreline distances, ocean detection, and ground color sampling. */
import { vegetationState } from "../state.js";
export function classifyVegetationSurface(value) {
  let toLowerCaseResult = String(value).toLowerCase();
  return /water|ocean|lava/.test(toLowerCaseResult)
    ? vegetationState.vegetationSurfaceIds.WATER
    : /sand|beach/.test(toLowerCaseResult)
      ? vegetationState.vegetationSurfaceIds.SAND
      : /snow|ice/.test(toLowerCaseResult)
        ? vegetationState.vegetationSurfaceIds.SNOW
        : /grass|meadow|turf|lawn/.test(toLowerCaseResult)
          ? vegetationState.vegetationSurfaceIds.GRASS
          : /stone|rock|cobble|gravel|brick|ore|slate|granite|cliff/.test(toLowerCaseResult)
            ? vegetationState.vegetationSurfaceIds.STONE
            : /dirt|soil|mud|farm|clay/.test(toLowerCaseResult)
              ? vegetationState.vegetationSurfaceIds.DIRT
              : /path|road|plank|wood|log|brick|tile|floor/.test(toLowerCaseResult)
                ? vegetationState.vegetationSurfaceIds.OTHER
                : /air|empty|none/.test(toLowerCaseResult)
                  ? -1
                  : vegetationState.vegetationSurfaceIds.OTHER;
}
