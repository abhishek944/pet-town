import type { DesertMode } from "./preferences-types";

export interface DesertPalette {
  sand: string;
  lightSand: string;
  shadow: string;
  rock: string;
  highlight: string;
  wood: string;
  bark: string;
  leaf: string;
  darkLeaf: string;
  water: string;
  fabric: string;
}

export function paletteFor(mode: DesertMode): DesertPalette {
  return mode === "moonlit-oasis"
    ? {
        sand: "#7d8ead",
        lightSand: "#b3b8c3",
        shadow: "#53647f",
        rock: "#ab9da2",
        highlight: "#d2c5b1",
        wood: "#8b807a",
        bark: "#625c64",
        leaf: "#789e96",
        darkLeaf: "#506f75",
        water: "#659cae",
        fabric: "#ba9190",
      }
    : {
        sand: "#dca66d",
        lightSand: "#f4d296",
        shadow: "#ad7859",
        rock: "#dcab82",
        highlight: "#f8d8a3",
        wood: "#b18865",
        bark: "#805e4c",
        leaf: "#8bb898",
        darkLeaf: "#497f71",
        water: "#79c7bf",
        fabric: "#c47e65",
      };
}

export function desertSky(mode: DesertMode): string {
  if (mode === "moonlit-oasis") {
    const stars = Array.from({ length: 21 }, (_, index) => {
      const size = 0.7 + (index % 3) * 0.3;
      return `<ellipse cx="${40 + index * 69}" cy="${23 + ((index * 47) % 150)}" rx="${size}" ry="${size}" fill="#e7e5d9" opacity=".65"/>`;
    }).join("");
    return `<g data-desert-edge="right" data-desert-sky=""><path d="M1289 40a19 19 0 1 0 19 27a17 17 0 0 1-19-27Z" fill="#f4e7cf"/></g>${stars}`;
  }
  return '<g data-desert-edge="right" data-desert-sky=""><ellipse cx="1288" cy="57" rx="23" ry="23" fill="#ffd394" opacity=".9"/><ellipse cx="1288" cy="57" rx="32" ry="32" fill="#ffd394" opacity=".1"/></g>';
}

export function desertTerrain(palette: DesertPalette): string {
  return (
    `<path d="M0 237Q118 172 295 242Q420 273 612 273Q786 247 961 272Q1185 262 1357 218Q1444 197 1512 233V290H0Z" fill="${palette.sand}" opacity=".35"/>` +
    `<path d="M0 263Q137 228 270 265Q466 284 729 281Q949 286 1104 269Q1340 227 1512 265V290H0Z" fill="${palette.sand}"/>` +
    `<path d="M0 267Q138 242 270 267M1088 273Q1333 242 1512 267" fill="none" stroke="${palette.lightSand}" stroke-width="2" opacity=".8"/>` +
    `<path d="M0 282Q302 272 568 286T1018 286T1512 278V290H0Z" fill="${palette.lightSand}" opacity=".8"/>` +
    `<path d="M419 280q24-5 48-1m540 5q32-7 65-3M812 288h39" stroke="${palette.shadow}" fill="none" stroke-width="1" opacity=".5"/>`
  );
}
