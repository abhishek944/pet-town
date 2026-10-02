/** Sun and moon directions and elevation from normalized day time. */
import { skyState } from "../state.js";
export function getSunElevationRadians(value) {
  return (
    (skyState.maximumSunElevationRadians * (Math.sin(2 * Math.PI * (value - 0.25)) + 0.1)) / 1.1
  );
}
