/** Building API module, hotbar state, history queues, skin assignments and terrain resolution. */
import { getTerrainBlockDefinitions } from "./get-terrain-block-definitions.js";
import { buildingState } from "../state.js";
import { synchronizeTerrainBlockTextures } from "./synchronize-terrain-block-textures.js";
import { normalizeBlockName } from "../block-names/normalize-block-name.js";
import { createBlockFaceCanvas } from "../icons/create-block-face-canvas.js";
export function resolveBuildingPalette() {
  let terrainBlockDefinitionsResult = getTerrainBlockDefinitions();
  if (
    (buildingState.buildingRuntime.idToKey.clear(),
    buildingState.buildingRuntime.nonSolid.clear(),
    !terrainBlockDefinitionsResult)
  ) {
    for (let result of buildingState.resolvedBuildingPalette) {
      Object.assign(result, {
        resolvedId: result.id,
        available: true,
        native: true,
        skin: null,
        source: `default`,
      });
    }
    for (let result2 of buildingState.resolvedBuildingPalette) {
      buildingState.buildingRuntime.idToKey.set(result2.id, result2.key);
    }
    buildingState.buildingRuntime.resolvedFrom = `default`;
    synchronizeTerrainBlockTextures();
    return;
  }
  buildingState.buildingRuntime.resolvedFrom = `terrain`;
  for (let result3 of terrainBlockDefinitionsResult) {
    let normalizeBlockNameResult = normalizeBlockName(result3.name);
    if (
      normalizeBlockNameResult === `air` ||
      normalizeBlockNameResult === `empty` ||
      normalizeBlockNameResult === `none`
    ) {
      buildingState.buildingRuntime.airId = result3.id;
    }
    if (
      normalizeBlockNameResult === `air` ||
      normalizeBlockNameResult.includes(`water`) ||
      result3.def?.solid === false ||
      result3.def?.liquid
    ) {
      buildingState.buildingRuntime.nonSolid.add(result3.id);
    }
  }
  let filterResult = terrainBlockDefinitionsResult.filter(
    (idValue) => !buildingState.buildingRuntime.nonSolid.has(idValue.id),
  );
  let callback = (value) =>
    filterResult.find((nameValue) => normalizeBlockName(nameValue.name) === value);
  let items = new Set();
  for (let result4 of buildingState.resolvedBuildingPalette) {
    let result5 = null;
    for (let result9 of buildingState.buildingBlockAliases[result4.key] ?? [result4.key]) {
      let callbackResult = callback(result9);
      if (callbackResult && !items.has(callbackResult.id)) {
        result5 = callbackResult;
        break;
      }
    }
    if (result5) {
      Object.assign(result4, {
        resolvedId: result5.id,
        available: true,
        native: true,
        skin: null,
        source: `terrain:` + result5.name,
      });
      items.add(result5.id);
      continue;
    }
    let result6 =
      buildingState.buildingTerrain.registerBlock ??
      buildingState.buildingTerrain.addBlockType ??
      buildingState.buildingTerrain.defineBlock;
    let result7;
    if (typeof result6 == `function`) {
      try {
        result7 = result6.call(buildingState.buildingTerrain, {
          key: result4.key,
          name: result4.name,
          colors: result4.colors,
          emissive: result4.emissive ?? 0,
          transparent: !!result4.transparent,
          textures: {
            top: createBlockFaceCanvas(result4.key, `top`, 128),
            side: createBlockFaceCanvas(result4.key, `side`, 128),
            bottom: createBlockFaceCanvas(result4.key, `bottom`, 128),
          },
        });
      } catch {
        result7 = undefined;
      }
    }
    if (Number.isFinite(result7)) {
      Object.assign(result4, {
        resolvedId: result7,
        available: true,
        native: true,
        skin: null,
        source: `registered`,
      });
      continue;
    }
    let result8 = null;
    for (let result10 of buildingState.buildingBlockFallbacks[result4.key] ?? []) {
      if (((result8 = callback(result10)), result8)) {
        break;
      }
    }
    result8 ??= filterResult.find(
      (idValue2) => idValue2.id !== buildingState.buildingRuntime.airId,
    );
    if (result8) {
      Object.assign(result4, {
        resolvedId: result8.id,
        available: true,
        native: false,
        skin: result4.key,
        source: `skin:` + result8.name,
      });
    } else {
      Object.assign(result4, {
        available: false,
        native: false,
        skin: null,
        source: `missing`,
      });
    }
  }
  for (let result11 of terrainBlockDefinitionsResult) {
    let normalizeBlockNameResult2 = normalizeBlockName(result11.name);
    let result12 = null;
    for (let [result13, result14] of Object.entries(buildingState.buildingBlockAliases)) {
      if (result14.includes(normalizeBlockNameResult2)) {
        result12 = result13;
        break;
      }
    }
    buildingState.buildingRuntime.idToKey.set(
      result11.id,
      result12 ??
        (normalizeBlockNameResult2.includes(`water`) ? `water` : normalizeBlockNameResult2),
    );
  }
  for (let result15 of buildingState.resolvedBuildingPalette) {
    if (result15.native) {
      buildingState.buildingRuntime.idToKey.set(result15.resolvedId, result15.key);
    }
  }
  synchronizeTerrainBlockTextures();
}
