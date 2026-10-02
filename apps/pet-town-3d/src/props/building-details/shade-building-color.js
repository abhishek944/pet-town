/** Wall shading, ivy, trailing vines, flower rosettes, cottage windows and gabled roof details. */
import { clonePropColor } from "../geometry-builder/clone-prop-color.js";
export function shadeBuildingColor(value, value2) {
  return clonePropColor(value).multiplyScalar(value2);
}
