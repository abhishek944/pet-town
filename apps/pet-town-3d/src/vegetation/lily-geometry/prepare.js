/** Lily pad palettes, veined pads and flowering lily clusters. */
import { vegetationState } from "../state.js";
import { foliageColorToRgb } from "../geometry-helpers/foliage-color-to-rgb.js";
export function prepareVegetationLilyGeometry() {
  vegetationState.lilyPadPalettes = [
    {
      inC: foliageColorToRgb(`#8fcf5a`),
      out: foliageColorToRgb(`#4f9c3c`),
      vein: foliageColorToRgb(`#b7e27c`),
    },
    {
      inC: foliageColorToRgb(`#7cc466`),
      out: foliageColorToRgb(`#3f8e45`),
      vein: foliageColorToRgb(`#a8da88`),
    },
    {
      inC: foliageColorToRgb(`#cfcc62`),
      out: foliageColorToRgb(`#9aa53f`),
      vein: foliageColorToRgb(`#e6df90`),
      edge: foliageColorToRgb(`#b08a3c`),
    },
  ];
}
