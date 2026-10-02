/** Stairs, moss shading, faceted rocks, path stones and campfire base geometry. */
import { clonePropColor } from "../geometry-builder/clone-prop-color.js";
import { propsState } from "../state.js";
import { propValueNoise3d } from "../math/prop-value-noise3d.js";
import { clampPropValue } from "../math/clamp-prop-value.js";
import { propFractalNoise3d } from "../math/prop-fractal-noise3d.js";
export function createRockMossColorizer(value, value2 = 0.5, value3 = 0) {
  let clonePropColorResult = clonePropColor(propsState.propPalette.moss);
  return (lerpValue, value4, value5, value6, value7, value8) => {
    let propValueNoise3dResult = propValueNoise3d(
      value4 * 2.3 + value3,
      value5 * 2.3,
      value6 * 2.3,
    );
    let clampPropValueResult = clampPropValue(
      (value8 - (0.75 - value2 * 0.5) + (propValueNoise3dResult - 0.5) * 0.5) * 3.5,
    );
    lerpValue.lerp(clonePropColorResult, clampPropValueResult * 0.8);
    lerpValue.multiplyScalar(
      1 + (propFractalNoise3d(value4 * 3 + value3, value5 * 3, value6 * 3, 2) - 0.5) * 0.18,
    );
  };
}
