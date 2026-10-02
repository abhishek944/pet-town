/** Texture layer ids, block ids and the built-in terrain block registry. */
import { terrainState } from "../state.js";
import { defineTerrainBlock } from "./define-terrain-block.js";
export function prepareTerrainBlockDefinitions() {
  terrainState.terrainTextureLayerIds = {
    GRASS_TOP: 0,
    DIRT: 1,
    STONE: 2,
    STONE_TOP: 3,
    SAND: 4,
    CLAY: 5,
    DARK: 6,
    PATH: 7,
    FRINGE: 8,
    SANDSTONE: 9,
    MOSS: 10,
    PLANKS: 11,
    COBBLE: 12,
    LOG_SIDE: 13,
    LOG_TOP: 14,
    GRAVEL: 15,
    PATH_EDGE: 16,
    DIRT_TOP: 17,
    SAND_SIDE: 18,
  };
  terrainState.terrainBlockIds = {
    AIR: 0,
    GRASS: 1,
    DIRT: 2,
    STONE: 3,
    SAND: 4,
    CLAY: 5,
    DARKSTONE: 6,
    PATH: 7,
    SANDSTONE: 8,
    GRAVEL: 9,
    MOSSY: 10,
    PLANKS: 11,
    COBBLE: 12,
    LOG: 13,
  };
  terrainState.terrainBlockDefinitions = [];
  defineTerrainBlock(terrainState.terrainBlockIds.AIR, `Air`, {
    solid: false,
  });
  defineTerrainBlock(terrainState.terrainBlockIds.GRASS, `Grass`, {
    top: terrainState.terrainTextureLayerIds.GRASS_TOP,
    side: terrainState.terrainTextureLayerIds.DIRT,
    bottom: terrainState.terrainTextureLayerIds.DIRT_TOP,
    exposedSideOver: terrainState.terrainTextureLayerIds.FRINGE,
    tint: `grass`,
    color: 8176207,
  });
  defineTerrainBlock(terrainState.terrainBlockIds.DIRT, `Dirt`, {
    top: terrainState.terrainTextureLayerIds.DIRT_TOP,
    side: terrainState.terrainTextureLayerIds.DIRT,
    bottom: terrainState.terrainTextureLayerIds.DIRT_TOP,
    tint: `earth`,
    color: 10185283,
    blendGrass: true,
  });
  defineTerrainBlock(terrainState.terrainBlockIds.STONE, `Stone`, {
    top: terrainState.terrainTextureLayerIds.STONE_TOP,
    side: terrainState.terrainTextureLayerIds.STONE,
    bottom: terrainState.terrainTextureLayerIds.STONE,
    tint: `stone`,
    color: 10722450,
  });
  defineTerrainBlock(terrainState.terrainBlockIds.SAND, `Sand`, {
    top: terrainState.terrainTextureLayerIds.SAND,
    side: terrainState.terrainTextureLayerIds.SAND_SIDE,
    bottom: terrainState.terrainTextureLayerIds.SAND_SIDE,
    tint: `sand`,
    color: 15521952,
    blendGrass: true,
  });
  defineTerrainBlock(terrainState.terrainBlockIds.CLAY, `Clay`, {
    top: terrainState.terrainTextureLayerIds.CLAY,
    side: terrainState.terrainTextureLayerIds.CLAY,
    bottom: terrainState.terrainTextureLayerIds.CLAY,
    tint: `earth`,
    color: 13208412,
  });
  defineTerrainBlock(terrainState.terrainBlockIds.DARKSTONE, `Slate`, {
    top: terrainState.terrainTextureLayerIds.DARK,
    side: terrainState.terrainTextureLayerIds.DARK,
    bottom: terrainState.terrainTextureLayerIds.DARK,
    tint: `stone`,
    color: 8290960,
  });
  defineTerrainBlock(terrainState.terrainBlockIds.PATH, `Path`, {
    top: terrainState.terrainTextureLayerIds.PATH,
    side: terrainState.terrainTextureLayerIds.DIRT,
    bottom: terrainState.terrainTextureLayerIds.DIRT_TOP,
    exposedSideOver: terrainState.terrainTextureLayerIds.PATH_EDGE,
    tint: `path`,
    color: 13808002,
    blendGrass: true,
  });
  defineTerrainBlock(terrainState.terrainBlockIds.SANDSTONE, `Sandstone`, {
    top: terrainState.terrainTextureLayerIds.SANDSTONE,
    side: terrainState.terrainTextureLayerIds.SANDSTONE,
    bottom: terrainState.terrainTextureLayerIds.SANDSTONE,
    tint: `sand`,
    color: 14729354,
  });
  defineTerrainBlock(terrainState.terrainBlockIds.GRAVEL, `Gravel`, {
    top: terrainState.terrainTextureLayerIds.GRAVEL,
    side: terrainState.terrainTextureLayerIds.GRAVEL,
    bottom: terrainState.terrainTextureLayerIds.GRAVEL,
    tint: `stone`,
    color: 10130314,
    blendGrass: true,
  });
  defineTerrainBlock(terrainState.terrainBlockIds.MOSSY, `Mossy Stone`, {
    top: terrainState.terrainTextureLayerIds.STONE_TOP,
    topOver: terrainState.terrainTextureLayerIds.MOSS,
    side: terrainState.terrainTextureLayerIds.STONE,
    bottom: terrainState.terrainTextureLayerIds.STONE,
    exposedSideOver: terrainState.terrainTextureLayerIds.FRINGE,
    tint: `stone`,
    color: 9414768,
  });
  defineTerrainBlock(terrainState.terrainBlockIds.PLANKS, `Planks`, {
    top: terrainState.terrainTextureLayerIds.PLANKS,
    side: terrainState.terrainTextureLayerIds.PLANKS,
    bottom: terrainState.terrainTextureLayerIds.PLANKS,
    tint: `wood`,
    color: 12618325,
  });
  defineTerrainBlock(terrainState.terrainBlockIds.COBBLE, `Cobblestone`, {
    top: terrainState.terrainTextureLayerIds.COBBLE,
    side: terrainState.terrainTextureLayerIds.COBBLE,
    bottom: terrainState.terrainTextureLayerIds.COBBLE,
    tint: `stone`,
    color: 10262156,
  });
  defineTerrainBlock(terrainState.terrainBlockIds.LOG, `Log`, {
    top: terrainState.terrainTextureLayerIds.LOG_TOP,
    side: terrainState.terrainTextureLayerIds.LOG_SIDE,
    bottom: terrainState.terrainTextureLayerIds.LOG_TOP,
    tint: `wood`,
    color: 8016436,
  });
}
