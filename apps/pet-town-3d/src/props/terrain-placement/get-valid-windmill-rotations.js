/** Terrain footprint sampling, cardinal orientation and cottage/windmill entrance access. */
import { sampleWindmillEntranceTerrain } from "./sample-windmill-entrance-terrain.js";
export let getValidWindmillRotations = (value, value2, value3) =>
  [value3, value3 + Math.PI / 2, value3 - Math.PI / 2, value3 + Math.PI].filter(
    (value4) =>
      sampleWindmillEntranceTerrain(value, {
        ...value2,
        rot: value4,
      }).hi <= 0.3,
  );
