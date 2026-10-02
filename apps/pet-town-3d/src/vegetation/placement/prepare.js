/** Vegetation clearings, flower palettes and biome-aware world population. */
import { vegetationState } from "../state.js";
export function prepareVegetationPlacement() {
  vegetationState.vegetationFlowerTypes = [`daisy`, `round`, `tulip`, `puff`, `lavender`];
  vegetationState.vegetationFlowerColors = {
    pink: `#f7a3c0`,
    white: `#fff4e6`,
    yellow: `#ffd65c`,
    lilac: `#c9b0f7`,
    sky: `#a6c8ff`,
    coral: `#ff9a86`,
    orange: `#ffb45a`,
    rose: `#ec80a8`,
    purple: `#ad90ec`,
  };
  vegetationState.vegetationFlowerColorPairs = [
    [`pink`, `white`],
    [`yellow`, `white`],
    [`lilac`, `pink`],
    [`white`, `yellow`],
    [`coral`, `yellow`],
    [`sky`, `white`],
    [`lilac`, `white`],
    [`orange`, `yellow`],
    [`rose`, `pink`],
  ];
}
