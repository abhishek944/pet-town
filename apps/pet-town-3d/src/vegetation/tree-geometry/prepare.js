/** Tree palettes, trunks, broadleaf crowns, fruit, pine tiers and palm fronds. */
import { vegetationState } from "../state.js";
import { foliageColorToRgb } from "../geometry-helpers/foliage-color-to-rgb.js";
export function prepareVegetationTreeGeometry() {
  vegetationState.foliageColorRamps = {
    oak: [
      [0, foliageColorToRgb(`#23603a`)],
      [0.35, foliageColorToRgb(`#32893f`)],
      [0.7, foliageColorToRgb(`#5db444`)],
      [1, foliageColorToRgb(`#a6d85e`)],
    ],
    oakDeep: [
      [0, foliageColorToRgb(`#1d553a`)],
      [0.35, foliageColorToRgb(`#2b7b45`)],
      [0.72, foliageColorToRgb(`#4aa24a`)],
      [1, foliageColorToRgb(`#94cf62`)],
    ],
    blossom: [
      [0, foliageColorToRgb(`#e889ad`)],
      [0.35, foliageColorToRgb(`#f7a3c4`)],
      [0.72, foliageColorToRgb(`#fdbcd6`)],
      [1, foliageColorToRgb(`#ffdcea`)],
    ],
    autumn: [
      [0, foliageColorToRgb(`#c0461c`)],
      [0.35, foliageColorToRgb(`#ec6c22`)],
      [0.72, foliageColorToRgb(`#f9982e`)],
      [1, foliageColorToRgb(`#ffc44c`)],
    ],
    pine: [
      [0, foliageColorToRgb(`#23482d`)],
      [0.4, foliageColorToRgb(`#2f6538`)],
      [0.8, foliageColorToRgb(`#4a8a43`)],
      [1, foliageColorToRgb(`#7fb35a`)],
    ],
    pineWarm: [
      [0, foliageColorToRgb(`#2c4f2a`)],
      [0.4, foliageColorToRgb(`#3b6f35`)],
      [0.8, foliageColorToRgb(`#5d9544`)],
      [1, foliageColorToRgb(`#9bc160`)],
    ],
    pineCool: [
      [0, foliageColorToRgb(`#1f4432`)],
      [0.4, foliageColorToRgb(`#2a5e44`)],
      [0.8, foliageColorToRgb(`#43805a`)],
      [1, foliageColorToRgb(`#78ad76`)],
    ],
    bush: [
      [0, foliageColorToRgb(`#215a36`)],
      [0.4, foliageColorToRgb(`#328741`)],
      [0.8, foliageColorToRgb(`#5bb247`)],
      [1, foliageColorToRgb(`#a0d565`)],
    ],
    sapling: [
      [0, foliageColorToRgb(`#2c6b3a`)],
      [0.5, foliageColorToRgb(`#4d9e44`)],
      [1, foliageColorToRgb(`#9ccf62`)],
    ],
  };
}
