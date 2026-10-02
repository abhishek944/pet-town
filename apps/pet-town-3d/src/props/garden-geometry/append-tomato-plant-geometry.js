/** Flower pots, produce piles, individual crops, raised garden beds, scarecrows and washing lines. */
import * as THREE from "three";
import { createBeveledPropBox } from "../geometry/create-beveled-prop-box.js";
import { propsState } from "../state.js";
import { createNoisyPropRock } from "../geometry/create-noisy-prop-rock.js";
import { varyPropColor } from "./vary-prop-color.js";
export function appendTomatoPlantGeometry(addValue, nextValue, value, value2) {
  addValue.add(`wood`, createBeveledPropBox(0.04, 0.8, 0.04, 0.01), {
    x: value,
    y: 0.4,
    z: value2,
    tint: propsState.propPalette.woodLight,
    uv: {
      grain: 1,
    },
  });
  addValue.add(`leaf`, createNoisyPropRock(0.2, 1, 0.3, 2.5, nextValue.next() * 9, 1.3), {
    x: value,
    y: 0.42,
    z: value2,
    tint: propsState.propPalette.leafDark,
  });
  for (let index = 0; index < 5; index++) {
    let result = nextValue.next() * propsState.propFullTurn;
    addValue.add(`plain`, new THREE.SphereGeometry(0.055, 8, 6), {
      x: value + Math.cos(result) * 0.17,
      y: nextValue.range(0.25, 0.6),
      z: value2 + Math.sin(result) * 0.17,
      tint: varyPropColor(
        nextValue,
        nextValue.chance(0.7) ? propsState.propPalette.red : propsState.propPalette.orange,
      ),
      noAO: true,
    });
  }
}
