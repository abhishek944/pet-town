/** Building API module, hotbar state, history queues, skin assignments and terrain resolution. */
import { setBlockFaceCanvasProvider } from "../icons/set-block-face-canvas-provider.js";
import { buildingState } from "../state.js";
import { createBlockMaterials } from "../materials/create-block-materials.js";
export function synchronizeTerrainBlockTextures() {
  setBlockFaceCanvasProvider((startsWithValue, value) => {
    let layers2 = buildingState.buildingTerrain?.atlas?.layers;
    if (!layers2 || !Array.isArray(buildingState.buildingTerrain.blocks)) {
      return null;
    }
    let result;
    if (startsWithValue.startsWith(`tid:`)) {
      result = Number(startsWithValue.slice(4));
    } else {
      let Result = buildingState.resolvedBuildingPalette.find(
        (keyValue) => keyValue.key === startsWithValue,
      );
      if (!Result?.native) {
        return null;
      }
      result = Result.resolvedId;
    }
    let result2 = buildingState.buildingTerrain.blocks[result];
    if (!result2 || result2.top == null) {
      return null;
    }
    let result3 =
      value === `top` ? result2.top : value === `bottom` ? result2.bottom : result2.side;
    let result4 =
      value === `top` ? result2.topOver : value === `side` ? result2.exposedSideOver : null;
    let cnv2 = layers2[result3]?.cnv;
    if (!cnv2) {
      return null;
    }
    let result5 = buildingState.buildingTerrain.atlas.blocksPerLayer ?? 2;
    let result6 = cnv2.width / result5;
    let element = document.createElement(`canvas`);
    element.width = element.height = result6;
    let painter = element.getContext(`2d`);
    painter.drawImage(cnv2, 0, 0, result6, result6, 0, 0, result6, result6);
    let result7 = result4 == null ? null : layers2[result4]?.cnv;
    if (result7) {
      let result8 = result7.width / result5;
      let result9 = value === `side` ? 0.7 : 1;
      painter.drawImage(
        result7,
        0,
        0,
        result8,
        result8 * result9,
        0,
        0,
        result6,
        result6 * result9,
      );
    }
    return element;
  });
  for (let result10 of buildingState.blockFaceTextureCache.values()) {
    result10.dispose();
  }
  buildingState.blockFaceTextureCache.clear();
  buildingState.blockMaterialCache.clear();
  for (let result11 of buildingState.blockSkinMeshes.values()) {
    result11.material = createBlockMaterials(result11.userData.key, {
      skin: true,
    });
  }
  if (buildingState.placementGhostMesh) {
    buildingState.placementGhostMesh.material = createBlockMaterials(
      buildingState.resolvedBuildingPalette[buildingState.buildingRuntime.selected].key,
      {
        ghost: true,
      },
    );
  }
  buildingState.buildingRuntime.version++;
}
