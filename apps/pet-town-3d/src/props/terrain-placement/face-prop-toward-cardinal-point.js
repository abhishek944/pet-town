/** Terrain footprint sampling, cardinal orientation and cottage/windmill entrance access. */
import { snapPropCardinalRotation } from "./snap-prop-cardinal-rotation.js";
export let facePropTowardCardinalPoint = (value, value2, value3, value4) =>
  snapPropCardinalRotation(Math.atan2(value3 - value, value4 - value2));
