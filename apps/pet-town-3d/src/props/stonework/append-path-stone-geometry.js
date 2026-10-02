/** Stairs, moss shading, faceted rocks, path stones and campfire base geometry. */
import { createNoisyPropRock } from "../geometry/create-noisy-prop-rock.js";
import { propsState } from "../state.js";
import { createPathStoneColorizer } from "./create-path-stone-colorizer.js";
export function appendPathStoneGeometry(addValue, rangeValue, rValue = {}) {
  let result = rValue.r ?? rangeValue.range(0.22, 0.31);
  let noisyPropRockResult = createNoisyPropRock(
    result,
    1,
    0.16,
    3 / result,
    rangeValue.next() * 99,
    0.28,
  );
  addValue.add(`rock`, noisyPropRockResult, {
    y: 0.035,
    sx: rangeValue.range(0.85, 1.2),
    sz: rangeValue.range(0.8, 1.1),
    ry: rangeValue.next() * propsState.propFullTurn,
    tint: rangeValue.pick([14077114, 13288116, 14471356, 12895680]),
    jitter: 0.06,
    noAO: true,
    down: 0.9,
    uv: {
      scale: 1 / 1.2,
    },
    colorFn: createPathStoneColorizer(result * 40),
  });
}
