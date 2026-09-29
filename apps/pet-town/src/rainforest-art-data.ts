import type { RainforestMode } from "./rainforest-motion";

export interface RainforestPalette {
  soilTop: string;
  soilBottom: string;
  ridge: string;
  trunk: string;
  bark: string;
  leafDark: string;
  leafMid: string;
  leafBright: string;
  blossom: string;
  mist: string;
}

export function paletteFor(mode: RainforestMode): RainforestPalette {
  return mode === "after-rain"
    ? {
        soilTop: "#2d604b",
        soilBottom: "#163d33",
        ridge: "#83ad67",
        trunk: "#163d33",
        bark: "#2d604b",
        leafDark: "#163d33",
        leafMid: "#2d604b",
        leafBright: "#83ad67",
        blossom: "#e18e92",
        mist: "#c8ecc2",
      }
    : {
        soilTop: "#214f49",
        soilBottom: "#102e32",
        ridge: "#4f9181",
        trunk: "#102e32",
        bark: "#214f49",
        leafDark: "#102e32",
        leafMid: "#214f49",
        leafBright: "#4f9181",
        blossom: "#b9de8a",
        mist: "#a7f1c2",
      };
}

export type LeafShade = "dark" | "mid" | "bright";
export const EDGE_LEAVES: readonly [number, number, number, string, LeafShade][] = [
  [10, 60, -62, "0.7", "dark"],
  [29, 73, -39, "0.85", "mid"],
  [48, 60, -16, "1.0", "bright"],
  [67, 73, 7, "0.7", "dark"],
  [86, 60, 30, "0.85", "mid"],
  [105, 73, 53, "1.0", "bright"],
  [124, 60, 76, "0.7", "dark"],
];

export type PlantKind = "fern" | "leaf-fan" | "leaf-spread";
export interface PlantLayout {
  x: number;
  scale: string;
  kind: PlantKind;
}

export const PLANT_LAYOUT: readonly PlantLayout[] = [
  { x: 18, scale: "0.9360000000000002", kind: "fern" },
  { x: 48, scale: "0.7540000000000001", kind: "leaf-fan" },
  { x: 78, scale: "0.9229999999999999", kind: "leaf-spread" },
  { x: 149, scale: "1.7472000000000003", kind: "fern" },
  { x: 188, scale: "0.5850000000000001", kind: "leaf-spread" },
  { x: 236, scale: "0.7540000000000001", kind: "leaf-fan" },
  { x: 433, scale: "0.77248", kind: "fern" },
  { x: 474, scale: "0.5712", kind: "leaf-fan" },
  { x: 522, scale: "0.30600000000000005", kind: "leaf-spread" },
  { x: 825, scale: "0.6310400000000002", kind: "fern" },
  { x: 862, scale: "0.4828", kind: "leaf-spread" },
  { x: 918, scale: "0.5712", kind: "leaf-fan" },
  { x: 1002, scale: "0.4896000000000001", kind: "fern" },
  { x: 1294, scale: "0.7540000000000001", kind: "leaf-fan" },
  { x: 1355, scale: "0.9229999999999999", kind: "leaf-spread" },
  { x: 1435, scale: "1.7472000000000003", kind: "fern" },
  { x: 1488, scale: "0.5850000000000001", kind: "leaf-spread" },
];

export const PLANT_DELAYS = [
  "0.0",
  "0.8",
  "1.6",
  "2.4000000000000004",
  "3.2",
  "4.0",
  "4.800000000000001",
  "5.6000000000000005",
  "6.4",
  "7.2",
  "8.0",
  "8.8",
  "9.600000000000001",
  "10.4",
  "11.200000000000001",
  "12.0",
  "12.8",
] as const;
export const FLOWER_X = [167, 469, 889, 1374] as const;
export const BUTTERFLIES = [
  { x: 244, y: 134, color: "#72c8e2", delay: "0.0" },
  { x: 958, y: 143, color: "#ecc475", delay: "1.7" },
  { x: 1280, y: 97, color: "#72c8e2", delay: "3.4" },
] as const;
export const FIREFLIES: readonly [number, number][] = [
  [1076, 208],
  [1001, 111],
  [322, 148],
  [130, 106],
  [1390, 127],
  [447, 122],
  [692, 110],
  [171, 152],
  [374, 145],
  [677, 171],
  [474, 160],
  [1342, 190],
  [530, 205],
  [973, 121],
  [150, 200],
  [122, 102],
  [1015, 144],
  [851, 173],
  [441, 170],
  [709, 161],
  [991, 201],
  [1281, 208],
  [718, 156],
  [531, 117],
  [894, 180],
  [1105, 170],
  [440, 217],
  [1225, 116],
  [85, 147],
  [965, 204],
  [446, 184],
  [975, 179],
  [131, 184],
  [311, 160],
  [1270, 171],
];
export const FIREFLY_DELAYS = [
  "0.0",
  "0.38",
  "0.76",
  "1.1400000000000001",
  "1.52",
  "1.9",
  "2.2800000000000002",
  "2.66",
  "3.04",
  "3.42",
  "3.8",
  "4.18",
  "4.5600000000000005",
  "4.94",
  "5.32",
  "5.7",
  "6.08",
  "6.46",
  "6.84",
  "7.22",
  "7.6",
  "7.98",
  "8.36",
  "8.74",
  "9.120000000000001",
  "9.5",
  "9.88",
  "10.26",
  "10.64",
  "11.02",
  "11.4",
  "11.78",
  "12.16",
  "12.540000000000001",
  "12.92",
] as const;
export const WATERLINE_DELAYS = ["0.0", "0.7", "1.4", "2.0999999999999996", "2.8"] as const;
export const RIPPLE_DELAYS = [
  "0.0",
  "0.4",
  "0.8",
  "1.2000000000000002",
  "1.6",
  "2.0",
  "2.4000000000000004",
  "2.8000000000000003",
  "3.2",
  "3.6",
  "4.0",
  "4.4",
  "4.800000000000001",
  "5.2",
  "5.6000000000000005",
  "6.0",
] as const;
