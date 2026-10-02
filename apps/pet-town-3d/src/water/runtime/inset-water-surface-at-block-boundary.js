/** Water lifecycle, terrain rebaking, dynamic reflections/refraction, ripples, splashes, and public water API. */
import { waterState } from "../state.js";
export let insetWaterSurfaceAtBlockBoundary = (value) =>
  Math.abs(value - Math.round(value)) < 0.06 ? value - waterState.waterIntegerLevelInset : value;
