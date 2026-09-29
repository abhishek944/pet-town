import type { DesertMode, DesertScene } from "./preferences-types";
import { desertSky, desertTerrain, paletteFor } from "./desert-art-palette";
import { sceneEdges } from "./desert-art-scenes";
import { grass } from "./desert-art-shapes";

export function createDesertArt(scene: DesertScene, mode: DesertMode): string {
  const palette = paletteFor(mode);
  const edges = sceneEdges(scene, mode, palette);
  return (
    '<svg viewBox="0 0 1512 290" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
    '<defs><filter id="glow"><feGaussianBlur stdDeviation="8"/></filter></defs>' +
    desertSky(mode) +
    desertTerrain(palette) +
    `<g data-desert-edge="left">${edges.left}</g>` +
    `<g data-desert-edge="right">${edges.right}</g>` +
    `<g>${grass(388, 282, 0.45, palette)}${grass(1264, 282, 0.45, palette)}</g>` +
    '<g data-desert-sand=""></g><g data-desert-dust=""></g></svg>'
  );
}
