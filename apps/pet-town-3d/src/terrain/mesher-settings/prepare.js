/** Bevel mesher face frames, ambient occlusion levels and shore/path shaping constants. */
import { terrainState } from "../state.js";
export function prepareTerrainMesherSettings() {
  terrainState.mesherGrassBlockId = terrainState.terrainBlockIds.GRASS;
  terrainState.mesherPathBlockId = terrainState.terrainBlockIds.PATH;
  terrainState.mesherMossEligibleBlockIds = new Set([
    terrainState.terrainBlockIds.STONE,
    terrainState.terrainBlockIds.DARKSTONE,
    terrainState.terrainBlockIds.CLAY,
    terrainState.terrainBlockIds.DIRT,
    terrainState.terrainBlockIds.GRASS,
    terrainState.terrainBlockIds.MOSSY,
  ]);
  terrainState.shoreSurfaceBlockHeight = 8;
  terrainState.shoreEdgeDrop = 0.55;
  terrainState.shoreEdgeFalloff = 0.6;
  terrainState.pathSurfaceDrop = 0.085;
  terrainState.voxelFaceFrames = [
    {
      n: [1, 0, 0],
      o: [1, 0, 0],
      U: [0, 1, 0],
      V: [0, 0, 1],
      ua: 1,
      va: 2,
    },
    {
      n: [-1, 0, 0],
      o: [0, 0, 0],
      U: [0, 0, 1],
      V: [0, 1, 0],
      ua: 2,
      va: 1,
    },
    {
      n: [0, 1, 0],
      o: [0, 1, 0],
      U: [0, 0, 1],
      V: [1, 0, 0],
      ua: 2,
      va: 0,
    },
    {
      n: [0, -1, 0],
      o: [0, 0, 0],
      U: [1, 0, 0],
      V: [0, 0, 1],
      ua: 0,
      va: 2,
    },
    {
      n: [0, 0, 1],
      o: [0, 0, 1],
      U: [1, 0, 0],
      V: [0, 1, 0],
      ua: 0,
      va: 1,
    },
    {
      n: [0, 0, -1],
      o: [0, 0, 0],
      U: [0, 1, 0],
      V: [1, 0, 0],
      ua: 1,
      va: 0,
    },
  ];
  terrainState.voxelAmbientOcclusionLevels = [0.5, 0.66, 0.83, 1];
}
