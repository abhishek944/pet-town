/** Player felt shading, wrapped lighting, dither fading and day-night material uniforms. */
import { playerMaterialSmoothstep } from "./player-material-smoothstep.js";
export function samplePlayerNightFactor(skyValue) {
  let result = skyValue?.sky?.nightFactor ?? skyValue?.lightState?.nightFactor;
  if (Number.isFinite(result)) {
    return Math.min(1, Math.max(0, result));
  }
  let result2 = Number.isFinite(skyValue?.timeOfDay) ? skyValue.timeOfDay : 0.4;
  return playerMaterialSmoothstep(0.12, -0.18, -Math.cos(result2 * Math.PI * 2));
}
