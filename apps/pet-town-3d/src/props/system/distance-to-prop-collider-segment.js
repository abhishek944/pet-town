/** Prop lifecycle, collision and interaction API, terrain reseating, static batches and animated prop effects. */
import { clampPropValue } from "../math/clamp-prop-value.js";
export function distanceToPropColliderSegment(value, value2, x2Value) {
  let result = x2Value.x2 - x2Value.x1;
  let result2 = x2Value.z2 - x2Value.z1;
  let result3 = result * result + result2 * result2 || 1e-9;
  let clampPropValueResult = clampPropValue(
    ((value - x2Value.x1) * result + (value2 - x2Value.z1) * result2) / result3,
  );
  return Math.hypot(
    value - (x2Value.x1 + result * clampPropValueResult),
    value2 - (x2Value.z1 + result2 * clampPropValueResult),
  );
}
