import type { DesertMode, DesertScene } from "./preferences-types";
import type { DesertPalette } from "./desert-art-palette";
import { adobe, grass, lamp, palm, spring, stone, tent } from "./desert-art-shapes";

export interface DesertEdgeArtwork {
  left: string;
  right: string;
}

export function sceneEdges(
  scene: DesertScene,
  mode: DesertMode,
  palette: DesertPalette,
): DesertEdgeArtwork {
  const night = mode === "moonlit-oasis";
  if (scene === "palm-spring") {
    return {
      left:
        spring(228, 262, 1, palette, night) +
        palm(62, 273, 1.08, palette) +
        palm(153, 261, 0.74, palette, -1) +
        stone(353, 278, 0.65, palette) +
        grass(21, 282, 0.45, palette),
      right:
        palm(1451, 273, 0.96, palette, -1) +
        stone(1339, 280, 0.9, palette) +
        lamp(1307, 278, 0.68, palette, night) +
        grass(1491, 282, 0.45, palette),
    };
  }

  if (scene === "adobe-outpost") {
    return {
      left:
        adobe(151, 272, 1.12, palette, night) +
        palm(34, 278, 0.83, palette) +
        stone(260, 279, 0.65, palette) +
        grass(21, 282, 0.45, palette),
      right:
        spring(1360, 271, 0.71, palette, night) +
        palm(1457, 274, 0.95, palette, -1) +
        lamp(1284, 277, 0.65, palette, night) +
        grass(1491, 282, 0.45, palette),
    };
  }

  return {
    left:
      tent(145, 275, 1.05, palette) +
      palm(22, 274, 0.75, palette) +
      lamp(248, 277, 0.8, palette, night) +
      grass(21, 282, 0.45, palette),
    right:
      tent(1413, 276, 0.64, palette) +
      lamp(1318, 278, 0.85, palette, night) +
      stone(1502, 280, 0.7, palette) +
      grass(1491, 282, 0.45, palette),
  };
}
