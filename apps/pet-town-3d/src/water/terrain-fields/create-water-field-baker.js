import { sampleWaterFieldWindow } from "./sample-water-field-window.js";
import { computeWaterCoast } from "./compute-water-coast.js";
import { computeWaterOpenness } from "./compute-water-openness.js";
import { shapeWaterBed } from "./shape-water-bed.js";
import { computeRiverFlow } from "./compute-river-flow.js";
import { uploadWaterFieldWindow } from "./upload-water-field-window.js";

/** Terrain-aware bed, coastal distance, openness and river current textures with incremental rebaking. */

export function createWaterFieldBaker(state) {
  return function (
    startX,
    startZ,
    width,
    height,
    writeStartX,
    writeStartZ,
    writeEndX,
    writeEndZ,
    incremental,
  ) {
    const region = {
      startX,
      startZ,
      width,
      height,
      writeStartX,
      writeStartZ,
      writeEndX,
      writeEndZ,
      incremental,
    };
    sampleWaterFieldWindow(region, state);
    computeWaterCoast(region, state);
    computeWaterOpenness(region, state);
    shapeWaterBed(region, state);
    computeRiverFlow(region, state);
    uploadWaterFieldWindow(region, state);
  };
}
