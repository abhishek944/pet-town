/** Foliage color ramps and vertex attributes, geometry buffers, normals and geometry merging. */
import { vegetationState } from "../state.js";
export let foliageColorToRgb = (value) => {
  vegetationState.foliageColorScratch.set(value);
  return [
    vegetationState.foliageColorScratch.r,
    vegetationState.foliageColorScratch.g,
    vegetationState.foliageColorScratch.b,
  ];
};
