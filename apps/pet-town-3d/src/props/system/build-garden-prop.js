/** Prop lifecycle, collision and interaction API, terrain reseating, static batches and animated prop effects. */
import { transformPropLocalPoint } from "./transform-prop-local-point.js";
import { buildRaisedGardenBedProp } from "../garden-geometry/build-raised-garden-bed-prop.js";
import { appendPumpkinGeometry } from "../garden-geometry/append-pumpkin-geometry.js";
import { appendSunflowerGeometry } from "../garden-geometry/append-sunflower-geometry.js";
import { buildScarecrowProp } from "../garden-geometry/build-scarecrow-prop.js";
import { buildFenceGeometry } from "../fences-and-bridges/build-fence-geometry.js";
import { buildFenceGateGeometry } from "../fences-and-bridges/build-fence-gate-geometry.js";
export function buildGardenProp(beginValue, rangeValue, itValue, footprintValue, value, value2) {
  let it2 = itValue.it;
  let result = 3.6;
  let result2 = 2.7;
  let callback = (value3, value4, value5, value6) => {
    let transformPropLocalPointResult = transformPropLocalPoint(it2, value3, 0, value4);
    return footprintValue.footprint(
      transformPropLocalPointResult.x,
      transformPropLocalPointResult.z,
      value5 / 2,
      value6 / 2,
      it2.rot,
      0.5,
    ).max;
  };
  for (let [result4, result5, result6, result7, result8] of [
    [-1.65, 0.75, 2.5, 1.25, `cabbage`],
    [1.65, 0.75, 2.5, 1.25, `carrot`],
    [-1.2, -1.2, 3.6, 1.1, `tomato`],
  ]) {
    let transformPropLocalPointResult2 = transformPropLocalPoint(it2, result4, 0, result5);
    let callbackResult = callback(result4, result5, result6, result7);
    beginValue.begin(
      transformPropLocalPointResult2.x,
      callbackResult,
      transformPropLocalPointResult2.z,
      it2.rot,
      {
        aoH: 0.4,
        aoMin: 0.65,
      },
    );
    let raisedGardenBedPropResult = buildRaisedGardenBedProp(beginValue, rangeValue, {
      w: result6,
      d: result7,
      crop: result8,
    });
    for (let result9 of raisedGardenBedPropResult.colliders) {
      value2(itValue, {
        ...result9,
        x: result4,
        z: result5,
        y0: callbackResult - it2.y,
      });
    }
  }
  {
    let transformPropLocalPointResult3 = transformPropLocalPoint(it2, 2.2, 0, -1.3);
    beginValue.begin(
      transformPropLocalPointResult3.x,
      footprintValue.h(transformPropLocalPointResult3.x, transformPropLocalPointResult3.z),
      transformPropLocalPointResult3.z,
      it2.rot,
      {
        aoH: 0.3,
        aoMin: 0.7,
      },
    );
    appendPumpkinGeometry(beginValue, rangeValue, -0.4, 0.1, 0.26);
    appendPumpkinGeometry(beginValue, rangeValue, 0.35, -0.2, 0.2);
    appendPumpkinGeometry(beginValue, rangeValue, 0.2, 0.45, 0.16);
  }
  for (let index = 0; index < 7; index++) {
    let transformPropLocalPointResult4 = transformPropLocalPoint(
      it2,
      -3.1 + index * 0.95 + rangeValue.range(-0.1, 0.1),
      0,
      -2.35,
    );
    beginValue.begin(
      transformPropLocalPointResult4.x,
      footprintValue.h(transformPropLocalPointResult4.x, transformPropLocalPointResult4.z),
      transformPropLocalPointResult4.z,
      it2.rot,
      {
        aoH: 0.3,
        aoMin: 0.7,
      },
    );
    appendSunflowerGeometry(beginValue, rangeValue, 0, 0);
  }
  {
    let transformPropLocalPointResult5 = transformPropLocalPoint(it2, 0.4, 0, -1.2);
    let result10 =
      footprintValue.h(transformPropLocalPointResult5.x, transformPropLocalPointResult5.z) + 0.36;
    beginValue.begin(
      transformPropLocalPointResult5.x,
      result10,
      transformPropLocalPointResult5.z,
      it2.rot,
      {
        aoH: 0.2,
        aoMin: 0.8,
      },
    );
    let scarecrowPropResult = buildScarecrowProp(beginValue, rangeValue);
    for (let result11 of scarecrowPropResult.colliders) {
      value2(itValue, {
        ...result11,
        x: 0.4,
        z: -1.2,
        y0: result10 - it2.y + result11.y0,
      });
    }
  }
  let result3 = 0.75;
  let callback2 = (value7, value8) => {
    let transformPropLocalPointResult6 = transformPropLocalPoint(it2, value7, 0, value8);
    return [transformPropLocalPointResult6.x, transformPropLocalPointResult6.z];
  };
  let values = [
    callback2(-0.75, result2),
    callback2(-3.6, result2),
    callback2(-3.6, -2.7),
    callback2(result, -2.7),
    callback2(result, result2),
    callback2(result3, result2),
  ];
  beginValue.begin(0, 0, 0, 0, {
    aoH: 0.6,
    aoMin: 0.65,
  });
  let callback3 = (value9, value10) => footprintValue.h(value9, value10);
  for (let result12 of buildFenceGeometry(beginValue, rangeValue, values, callback3)) {
    value2(itValue, {
      ...result12,
      world: true,
    });
  }
  for (let result13 of buildFenceGateGeometry(
    beginValue,
    rangeValue,
    callback2(-0.75, result2),
    callback2(result3, result2),
    callback3,
  )) {
    value2(itValue, {
      ...result13,
      world: true,
    });
  }
  value(itValue, `Garden`, 4);
}
