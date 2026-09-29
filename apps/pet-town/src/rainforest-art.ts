import { paletteFor } from "./rainforest-art-data";
import { rainforestFlowers, rainforestPlants, edgeFoliage } from "./rainforest-art-foliage";
import {
  gradients,
  rainforestCreek,
  rainforestMist,
  rainforestTerrain,
  rainforestToucan,
  rainforestWildlife,
} from "./rainforest-art-details";
import type { RainforestMode } from "./rainforest-motion";

export function createRainforestArt(mode: RainforestMode): string {
  const palette = paletteFor(mode);
  const creek = mode === "after-rain" ? rainforestCreek() : "";
  return (
    `<svg viewBox="0 0 1512 240" preserveAspectRatio="none" aria-hidden="true">` +
    gradients(palette) +
    rainforestTerrain(mode, palette) +
    edgeFoliage(palette) +
    creek +
    rainforestPlants(palette) +
    rainforestFlowers(palette) +
    rainforestWildlife(mode) +
    rainforestToucan() +
    rainforestMist() +
    "</svg>"
  );
}
