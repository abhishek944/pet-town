/** Flower pots, produce piles, individual crops, raised garden beds, scarecrows and washing lines. */
import { clonePropColor } from "../geometry-builder/clone-prop-color.js";
export let varyPropColor = (rangeValue, value, value2 = 1) =>
  clonePropColor(value).offsetHSL(
    rangeValue.range(-0.02, 0.02) * value2,
    rangeValue.range(-0.08, 0.04) * value2,
    rangeValue.range(-0.07, 0.04) * value2,
  );
