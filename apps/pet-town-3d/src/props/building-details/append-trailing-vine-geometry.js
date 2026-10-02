/** Wall shading, ivy, trailing vines, flower rosettes, cottage windows and gabled roof details. */
import * as THREE from "three";
import { mixPropScalar } from "../math/mix-prop-scalar.js";
import { createIvyLeafGeometry } from "./create-ivy-leaf-geometry.js";
import { propsState } from "../state.js";
export function appendTrailingVineGeometry(
  addValue,
  rangeValue,
  value,
  value2,
  value3,
  value4,
  value5,
  value6 = 7,
) {
  let result = Math.sin(value5);
  let result2 = Math.cos(value5);
  let rangeResult = rangeValue.range(-0.06, 0.06);
  let catmullRomCurve3 = new THREE.CatmullRomCurve3(
    [
      [0, 0, 0],
      [0.07, -0.05, 0],
      [0.1 + rangeResult, -value4 * 0.45, 0.02],
      [0.08 - rangeResult, -value4, -0.02],
    ].map(
      ([value7, value8, value9]) =>
        new THREE.Vector3(
          value + result * value7 + result2 * value9,
          value2 + value8,
          value3 + result2 * value7 - result * value9,
        ),
    ),
  );
  addValue.add(`leaf`, new THREE.TubeGeometry(catmullRomCurve3, 8, 0.011, 4), {
    tint: 5601843,
    noAO: true,
    uv: {
      mode: `none`,
    },
  });
  for (let index = 0; index < value6; index++) {
    let result3 = (index + 0.5) / value6;
    let pointResult = catmullRomCurve3.getPoint(result3);
    let result4 = mixPropScalar(0.72, 0.45, result3) * rangeValue.range(0.85, 1.15);
    addValue.add(`leaf`, createIvyLeafGeometry(), {
      x: pointResult.x + result * 0.01,
      y: pointResult.y,
      z: pointResult.z + result2 * 0.01,
      ry: value5 + rangeValue.range(-0.5, 0.5),
      rz: Math.PI + rangeValue.range(-0.9, 0.9),
      rx: rangeValue.range(-0.3, 0.3),
      sx: result4,
      sy: result4,
      sz: result4,
      tint: rangeValue.pick(propsState.ivyLeafPalette),
      jitter: 0.06,
      noAO: true,
    });
  }
}
