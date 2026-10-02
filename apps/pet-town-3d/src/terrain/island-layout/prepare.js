/** Biome definitions, water level, pond and hill landmarks, river and footpath waypoints. */
import { terrainState } from "../state.js";
export function prepareTerrainIslandLayout() {
  terrainState.terrainBiomeIds = {
    OCEAN: 0,
    BEACH: 1,
    MEADOW: 2,
    FOREST: 3,
    HILLS: 4,
    MOUNTAIN: 5,
    POND: 6,
    RIVER: 7,
    PATH: 8,
    ROCKY: 9,
    PLAINS: 10,
  };
  terrainState.terrainBiomeNames = [
    `ocean`,
    `beach`,
    `meadow`,
    `forest`,
    `hills`,
    `mountain`,
    `pond`,
    `river`,
    `path`,
    `rocky`,
    `plains`,
  ];
  terrainState.terrainWaterLevel = 7.62;
  terrainState.terrainPondLandmark = {
    x: -11,
    z: 9,
    r: 6.2,
  };
  terrainState.terrainHillLandmark = {
    x: 16,
    z: -13,
    r: 11,
    h: 5,
  };
  terrainState.terrainRiverWaypoints = [
    [-11, 9],
    [-15, 16],
    [-14, 23],
    [-19, 31],
    [-26, 38],
    [-29, 47],
    [-33, 56],
    [-38, 66],
    [-42, 76],
  ];
  terrainState.terrainPathWaypoints = [
    [
      [0, 0],
      [-3, 3],
      [-6, 6],
      [-9, 4.5],
    ],
    [
      [0, 0],
      [4, -3],
      [8, -6],
      [11, -9],
    ],
    [
      [0, 0],
      [5, 4],
      [11, 9],
      [18, 15],
      [24, 22],
      [30, 29],
      [35, 34],
    ],
    [
      [0, 0],
      [-4, -5],
      [-9, -11],
      [-13, -18],
      [-15, -25],
    ],
    [
      [0, 0],
      [7, 1],
      [15, 2],
      [22, 0],
      [29, -2],
    ],
  ];
}
