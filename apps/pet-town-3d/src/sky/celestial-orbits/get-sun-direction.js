/** Sun and moon directions and elevation from normalized day time. */
import { getSunElevationRadians } from "./get-sun-elevation-radians.js";
import { skyState } from "../state.js";
export function getSunDirection(value, setValue) {
  let sunElevationRadiansResult = getSunElevationRadians(value);
  let result = 2 * Math.PI * (value - 0.25);
  let result2 =
    Math.cos(result) * skyState.celestialOrbitBasisX.x +
    Math.sin(result) * skyState.celestialOrbitBasisZ.x;
  let result3 =
    Math.cos(result) * skyState.celestialOrbitBasisX.z +
    Math.sin(result) * skyState.celestialOrbitBasisZ.z;
  let result4 = Math.cos(sunElevationRadiansResult);
  return setValue
    .set(result2 * result4, Math.sin(sunElevationRadiansResult), result3 * result4)
    .normalize();
}
