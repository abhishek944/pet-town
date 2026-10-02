/** Prop lifecycle, collision and interaction API, terrain reseating, static batches and animated prop effects. */
import { clampPropValue } from "../math/clamp-prop-value.js";
import { propSmoothstep } from "../math/prop-smoothstep.js";
export function samplePropsNightFactor(paramsValue) {
  let result = paramsValue.params?.get?.(`propsDebugNight`);
  if (result != null && result !== `` && Number.isFinite(+result)) {
    return clampPropValue(+result);
  }
  let sky2 = paramsValue.sky;
  let result2 = typeof sky2?.sunElevation == `number` ? sky2.sunElevation : null;
  if (result2 == null && typeof paramsValue.timeOfDay == `number`) {
    result2 = Math.sin((paramsValue.timeOfDay - 0.25) * Math.PI * 2);
  }
  return result2 == null ? 0 : propSmoothstep(0.24, -0.1, result2);
}
