/** Stairs, moss shading, faceted rocks, path stones and campfire base geometry. */
import { clonePropColor } from "../geometry-builder/clone-prop-color.js";
import { propsState } from "../state.js";
import { propValueNoise3d } from "../math/prop-value-noise3d.js";
import { clampPropValue } from "../math/clamp-prop-value.js";
export function createPathStoneColorizer(value) {
  let clonePropColorResult = clonePropColor(propsState.propPalette.moss);
  return (lerpValue, value2, value3, value4, value5, value6) => {
    let propValueNoise3dResult = propValueNoise3d(value2 * 5 + value, value3 * 5, value4 * 5);
    lerpValue.lerp(
      clonePropColorResult,
      clampPropValue((propValueNoise3dResult - 0.62) * 2.2) * 0.6,
    );
    if (value6 < 0.4) {
      lerpValue.multiplyScalar(0.85);
    }
  };
}
