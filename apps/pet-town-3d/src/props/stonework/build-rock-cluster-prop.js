/** Stairs, moss shading, faceted rocks, path stones and campfire base geometry. */
import { propsState } from "../state.js";
import { flattenRockFacets } from "./flatten-rock-facets.js";
import { createNoisyPropRock } from "../geometry/create-noisy-prop-rock.js";
import { createRockMossColorizer } from "./create-rock-moss-colorizer.js";
export function buildRockClusterProp(addValue, rangeValue, rValue = {}) {
  let result = rValue.r ?? 1.1;
  let result2 = rValue.n ?? 4;
  let values = [13816008, 14472906, 13225160, 14208702];
  let index = 0;
  let values2 = [];
  for (let index2 = 0; index2 < result2; index2++) {
    let result3 = index2 === 0 ? result : result * rangeValue.range(0.28, 0.6);
    let result4 = rangeValue.next() * propsState.propFullTurn;
    let result5 = index2 === 0 ? 0 : result * rangeValue.range(0.85, 1.4);
    let result6 = Math.cos(result4) * result5;
    let result7 = Math.sin(result4) * result5;
    let rangeResult = rangeValue.range(0.66, 0.85);
    let flattenRockFacetsResult = flattenRockFacets(
      createNoisyPropRock(
        result3,
        result3 > 0.7 ? 3 : 2,
        0.18,
        1.1 / result3,
        rangeValue.next() * 50,
        rangeResult,
      ),
      rangeValue,
      result3,
    );
    let position2 = flattenRockFacetsResult.attributes.position;
    let index3 = 0;
    let index4 = 0;
    let index5 = 0;
    for (let index6 = 0; index6 < position2.count; index6++) {
      let xResult = position2.getX(index6);
      let yResult = position2.getY(index6);
      let zResult = position2.getZ(index6);
      let hypotResult = Math.hypot(xResult, zResult);
      index5 = Math.max(index5, hypotResult);
      if (hypotResult < result3 * 0.35) {
        index3 = Math.max(index3, yResult);
      } else {
        if (hypotResult > result3 * 0.8) {
          index4 = Math.max(index4, yResult);
        }
      }
    }
    addValue.add(`rock`, flattenRockFacetsResult, {
      x: result6,
      y: result3 * 0.24,
      z: result7,
      ry: rangeValue.next() * propsState.propFullTurn,
      tint: rangeValue.pick(values),
      jitter: 0.05,
      down: 0.86,
      colorFn: createRockMossColorizer(0, 0.42, index2 * 3.1),
    });
    index = Math.max(index, result5 + result3 * 0.8);
    if (result3 > 0.25) {
      values2.push({
        x: result6,
        z: result7,
        radius: Math.min(index5 * 0.9, result3 * 1.02),
        y0: -0.2,
        h: 0.2 + result3 * 0.24 + Math.max(index4, 0.05),
        noTop: true,
      });
      values2.push({
        x: result6,
        z: result7,
        radius: result3 * 0.4,
        y0: -0.2,
        h: 0.2 + result3 * 0.24 + index3 + 0.01,
        noTop: result3 < 0.45,
      });
    }
  }
  for (let index7 = 0; index7 < 5; index7++) {
    let result8 = rangeValue.next() * propsState.propFullTurn;
    let result9 = result * rangeValue.range(1.2, 2);
    addValue.add(`rock`, createNoisyPropRock(0.12, 1, 0.22, 5, rangeValue.next() * 50, 0.6), {
      x: Math.cos(result8) * result9,
      y: 0.03,
      z: Math.sin(result8) * result9,
      tint: rangeValue.pick(values),
      down: 0.9,
    });
  }
  return {
    radius: index,
    colliders: values2,
  };
}
