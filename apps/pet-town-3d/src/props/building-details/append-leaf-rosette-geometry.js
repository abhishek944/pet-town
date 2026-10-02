/** Wall shading, ivy, trailing vines, flower rosettes, cottage windows and gabled roof details. */
import { propsState } from "../state.js";
import { createIvyLeafGeometry } from "./create-ivy-leaf-geometry.js";
export function appendLeafRosetteGeometry(
  addValue,
  rangeValue,
  value,
  value2,
  value3,
  value4 = 1,
  value5 = 7,
) {
  for (let index = 0; index < value5; index++) {
    let result = (index / value5) * propsState.buildingFullTurn + rangeValue.range(-0.3, 0.3);
    let result2 = value4 * rangeValue.range(0.7, 1.05);
    addValue.add(`leaf`, createIvyLeafGeometry(), {
      x: value + Math.sin(result) * 0.02,
      y: value2,
      z: value3 + Math.cos(result) * 0.02,
      ry: result,
      rx: -rangeValue.range(0.35, 0.8),
      sx: result2,
      sy: result2,
      sz: result2,
      tint: rangeValue.pick(propsState.ivyLeafPalette),
      jitter: 0.06,
    });
  }
}
