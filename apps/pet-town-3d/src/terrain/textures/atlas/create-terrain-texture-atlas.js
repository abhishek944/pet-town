/** Bump encoding, texture array generation and incremental custom texture registration. */
import { terrainState } from "../../state.js";
import { createGrassTexture } from "../grass-dirt/create-grass-texture.js";
import { createDirtTexture } from "../grass-dirt/create-dirt-texture.js";
import { createLayeredStoneTexture } from "../stone-sand/create-layered-stone-texture.js";
import { createCobbleTexture } from "../stone-sand/create-cobble-texture.js";
import { createSandTexture } from "../stone-sand/create-sand-texture.js";
import { createClayTexture } from "../stone-sand/create-clay-texture.js";
import { createPathTexture } from "../path-wood/create-path-texture.js";
import { createGrassFringeTexture } from "../overlays/create-grass-fringe-texture.js";
import { createSandstoneTexture } from "../stone-sand/create-sandstone-texture.js";
import { createMossOverlayTexture } from "../overlays/create-moss-overlay-texture.js";
import { createPlankTexture } from "../path-wood/create-plank-texture.js";
import { createLogBarkTexture } from "../path-wood/create-log-bark-texture.js";
import { createLogEndTexture } from "../path-wood/create-log-end-texture.js";
import { createGravelTexture } from "../path-wood/create-gravel-texture.js";
import { createPathEdgeTexture } from "../overlays/create-path-edge-texture.js";
import { encodeTextureHeightAlpha } from "./encode-texture-height-alpha.js";
import { createTerrainArrayTexture } from "./create-terrain-array-texture.js";
export function createTerrainTextureAtlas(value) {
  let result = performance.now();
  let values = [];
  let callback = (value2, value3, value4, value5 = false) => {
    values[value2] = {
      cnv: value3,
      bump: value4,
      isOverlay: value5,
    };
  };
  callback(terrainState.terrainTextureLayerIds.GRASS_TOP, createGrassTexture(11), 0.55);
  callback(
    terrainState.terrainTextureLayerIds.DIRT,
    createDirtTexture(12, {
      band: false,
    }),
    1.4,
  );
  callback(terrainState.terrainTextureLayerIds.STONE, createLayeredStoneTexture(13), 1.1);
  callback(
    terrainState.terrainTextureLayerIds.STONE_TOP,
    createCobbleTexture(14, 5, [11050898, 12103842, 10327690, 11774099], 7038044, {
      mortar: 1.6,
      dome: 0.14,
    }),
    1.1,
  );
  callback(terrainState.terrainTextureLayerIds.SAND, createSandTexture(15), 0.45);
  callback(terrainState.terrainTextureLayerIds.CLAY, createClayTexture(16), 1.4);
  callback(
    terrainState.terrainTextureLayerIds.DARK,
    createLayeredStoneTexture(
      17,
      [9275265, 9932678, 8617078, 10327178, 9406335],
      5195842,
      13616827,
    ),
    1.2,
  );
  callback(terrainState.terrainTextureLayerIds.PATH, createPathTexture(18), 0.8);
  callback(terrainState.terrainTextureLayerIds.FRINGE, createGrassFringeTexture(19), 0, true);
  callback(terrainState.terrainTextureLayerIds.SANDSTONE, createSandstoneTexture(20), 0.9);
  callback(terrainState.terrainTextureLayerIds.MOSS, createMossOverlayTexture(21), 0, true);
  callback(terrainState.terrainTextureLayerIds.PLANKS, createPlankTexture(22), 0.7);
  callback(
    terrainState.terrainTextureLayerIds.COBBLE,
    createCobbleTexture(23, 6, [10985879, 10130570, 11775394, 9407106, 10721932], 6249042, {
      mortar: 3.2,
      dome: 0.3,
      shade: 0.16,
      jitter: 0.6,
    }),
    1.5,
  );
  callback(terrainState.terrainTextureLayerIds.LOG_SIDE, createLogBarkTexture(24), 1);
  callback(terrainState.terrainTextureLayerIds.LOG_TOP, createLogEndTexture(25), 0.6);
  callback(terrainState.terrainTextureLayerIds.GRAVEL, createGravelTexture(26), 1.4);
  callback(terrainState.terrainTextureLayerIds.PATH_EDGE, createPathEdgeTexture(27), 0, true);
  callback(
    terrainState.terrainTextureLayerIds.DIRT_TOP,
    createDirtTexture(28, {
      band: false,
    }),
    1,
  );
  callback(terrainState.terrainTextureLayerIds.SAND_SIDE, createSandTexture(29, false), 0.45);
  let length2 = values.length;
  let byteBuffer = new Uint8Array(
    terrainState.terrainTexturePixelSize * terrainState.terrainTexturePixelSize * 4 * length2,
  );
  for (let index = 0; index < length2; index++) {
    let { cnv: canvas, bump: result3, isOverlay: result4 } = values[index];
    let data2 = canvas
      .getContext(`2d`)
      .getImageData(
        0,
        0,
        terrainState.terrainTexturePixelSize,
        terrainState.terrainTexturePixelSize,
      ).data;
    let uint8ClampedArray = new Uint8ClampedArray(data2);
    if (!result4) {
      encodeTextureHeightAlpha(uint8ClampedArray, 1);
    }
    let result5 =
      index * terrainState.terrainTexturePixelSize * terrainState.terrainTexturePixelSize * 4;
    for (let index2 = 0; index2 < terrainState.terrainTexturePixelSize; index2++) {
      byteBuffer.set(
        uint8ClampedArray.subarray(
          (511 - index2) * terrainState.terrainTexturePixelSize * 4,
          (terrainState.terrainTexturePixelSize - index2) *
            terrainState.terrainTexturePixelSize *
            4,
        ),
        result5 + index2 * terrainState.terrainTexturePixelSize * 4,
      );
    }
    terrainState.terrainAtlasBumpStrengths[index] = result3;
  }
  let terrainArrayTextureResult = createTerrainArrayTexture(byteBuffer, length2, value);
  let result2 = performance.now() - result;
  let fillResult = Array(length2).fill(1);
  fillResult[terrainState.terrainTextureLayerIds.SAND] = 0.3;
  fillResult[terrainState.terrainTextureLayerIds.SAND_SIDE] = 0.3;
  fillResult[terrainState.terrainTextureLayerIds.PATH] = 0.45;
  fillResult[terrainState.terrainTextureLayerIds.SANDSTONE] = 0.6;
  fillResult[terrainState.terrainTextureLayerIds.GRAVEL] = 0.5;
  fillResult[terrainState.terrainTextureLayerIds.PLANKS] = 1.4;
  fillResult[terrainState.terrainTextureLayerIds.COBBLE] = 1.2;
  return {
    texture: terrainArrayTextureResult,
    data: byteBuffer,
    layers: values,
    bump: terrainState.terrainAtlasBumpStrengths.slice(),
    seam: fillResult,
    emit: Array(length2).fill(0),
    count: length2,
    ms: result2,
    blocksPerLayer: 2,
    renderer: value,
  };
}
