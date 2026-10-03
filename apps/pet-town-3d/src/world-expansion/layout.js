/** Fixed, authored districts. Coordinates stay stable across releases and saves. */
export const WORLD_SIZE = 256;
export const WORLD_HEIGHT = 40;
export const EXPANSION_STAGE = 3;
export const SUNMEADOW = {
  id: "sunmeadow",
  name: "Sunmeadow",
  shapes: [
    { x: 79, z: 0, rx: 43, rz: 40 },
    { x: 77, z: 24, rx: 30, rz: 26 },
    { x: 101, z: -18, rx: 22, rz: 23 },
  ],
  paths: [
    [
      [29, -2, 9],
      [44, -2, 9],
      [55, 0, 10],
      [68, 4, 10],
      [78, 0, 10],
    ],
    [
      [78, 0, 10],
      [86, -6, 10],
      [96, -13, 13],
      [102, -15, 15],
    ],
    [
      [78, 0, 10],
      [78, 8, 10],
      [76, 16, 10],
    ],
    [
      [78, 8, 10],
      [89, 12, 10],
      [101, 23, 9],
    ],
    [
      [55, 0, 10],
      [61, -8, 10],
      [65, -22, 10],
    ],
  ],
  clearings: [
    { x: 76, z: 16, r: 9, height: 10 },
    { x: 65, z: -22, r: 7, height: 10 },
    { x: 102, z: -15, r: 5, height: 15 },
    { x: 78, z: 0, r: 7, height: 10 },
    { x: 83, z: -23, r: 6, height: 10 },
    { x: 94, z: 4, r: 6, height: 10 },
  ],
};
