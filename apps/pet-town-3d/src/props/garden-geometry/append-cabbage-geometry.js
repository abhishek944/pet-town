/** Flower pots, produce piles, individual crops, raised garden beds, scarecrows and washing lines. */
import { createNoisyPropRock } from "../geometry/create-noisy-prop-rock.js";
import { varyPropColor } from "./vary-prop-color.js";
import { propsState } from "../state.js";
export function appendCabbageGeometry(addValue, nextValue, value, value2) {
  addValue.add(`plain`, createNoisyPropRock(0.13, 1, 0.12, 3, nextValue.next() * 9, 0.85), {
    x: value,
    y: 0.13,
    z: value2,
    tint: varyPropColor(nextValue, 11000956),
  });
  for (let index = 0; index < 5; index++) {
    let result = (index / 5) * propsState.propFullTurn + nextValue.next();
    addValue.add(`leaf`, createNoisyPropRock(0.12, 1, 0.15, 3, nextValue.next() * 9, 0.3), {
      x: value + Math.cos(result) * 0.12,
      y: 0.06,
      z: value2 + Math.sin(result) * 0.12,
      rx: Math.sin(result) * 0.5,
      rz: -Math.cos(result) * 0.5,
      tint: varyPropColor(nextValue, propsState.propPalette.leaf),
    });
  }
}
