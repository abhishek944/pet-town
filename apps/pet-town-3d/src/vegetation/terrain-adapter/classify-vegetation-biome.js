/** Terrain and block classification, height snapshots, shoreline distances, ocean detection, and ground color sampling. */
import { vegetationState } from "../state.js";
export function classifyVegetationBiome(value) {
  let toLowerCaseResult = String(value).toLowerCase();
  return /ocean|sea|lake|river|water/.test(toLowerCaseResult)
    ? vegetationState.vegetationBiomeIds.WATER
    : /beach|sand|shore|coast/.test(toLowerCaseResult)
      ? vegetationState.vegetationBiomeIds.BEACH
      : /snow|ice|tundra|frost|glacier/.test(toLowerCaseResult)
        ? vegetationState.vegetationBiomeIds.SNOW
        : /mount|rock|cliff|stone|peak|alpine|highland/.test(toLowerCaseResult)
          ? vegetationState.vegetationBiomeIds.MOUNTAIN
          : /hill|upland|ridge/.test(toLowerCaseResult)
            ? vegetationState.vegetationBiomeIds.HILLS
            : /desert|dune|arid|mesa|badland/.test(toLowerCaseResult)
              ? vegetationState.vegetationBiomeIds.DESERT
              : /swamp|marsh|bog|wetland/.test(toLowerCaseResult)
                ? vegetationState.vegetationBiomeIds.SWAMP
                : /forest|wood|jungle|grove|taiga|pine|conifer/.test(toLowerCaseResult)
                  ? vegetationState.vegetationBiomeIds.FOREST
                  : /town|village|path|road|plaza|city|farm|build/.test(toLowerCaseResult)
                    ? vegetationState.vegetationBiomeIds.TOWN
                    : /meadow|grass|plain|field|valley|flower|prairie|savann/.test(
                          toLowerCaseResult,
                        )
                      ? vegetationState.vegetationBiomeIds.MEADOW
                      : -1;
}
