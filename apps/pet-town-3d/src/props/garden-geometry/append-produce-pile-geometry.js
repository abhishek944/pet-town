/** Flower pots, produce piles, individual crops, raised garden beds, scarecrows and washing lines. */
import * as THREE from "three";
import { propsState } from "../state.js";
import { varyPropColor } from "./vary-prop-color.js";
import { clonePropColor } from "../geometry-builder/clone-prop-color.js";
import { clampPropValue } from "../math/clamp-prop-value.js";
import { createBeveledPropCylinder } from "../geometry/create-beveled-prop-cylinder.js";
import { createNoisyPropRock } from "../geometry/create-noisy-prop-rock.js";
export function appendProducePileGeometry(addValue, rangeValue, value, value2, value3) {
  let result = {
    apple: [propsState.propPalette.red, 0.075],
    orange: [propsState.propPalette.orange, 0.08],
    cabbage: [9425002, 0.12],
    lemon: [propsState.propPalette.yellow, 0.07],
    plum: [9067472, 0.065],
    melon: [5216826, 0.14],
  }[value3] ?? [propsState.propPalette.red, 0.08];
  let result2 = result[1];
  let result3 = value3 === `melon` ? 5 : Math.round((value * value2) / (result2 * result2 * 3.2));
  for (let index = 0; index < result3; index++) {
    let result4 =
      value3 === `melon`
        ? ((index % 3) - 1) * result2 * 1.9 + rangeValue.range(-0.02, 0.02)
        : rangeValue.range(-value / 2 + result2, value / 2 - result2);
    let result5 =
      value3 === `melon`
        ? (index < 3 ? -result2 * 0.9 : result2 * 0.9) + rangeValue.range(-0.02, 0.02)
        : rangeValue.range(-value2 / 2 + result2, value2 / 2 - result2);
    let result6 =
      (1 - (Math.abs(result4) / (value / 2)) ** 2) * (1 - (Math.abs(result5) / (value2 / 2)) ** 2);
    let result7 =
      result2 + (value3 === `melon` ? 0 : result6 * result2 * 1.6) + rangeValue.next() * 0.02;
    let varyPropColorResult = varyPropColor(rangeValue, result[0]);
    if (value3 === `melon`) {
      let clonePropColorResult = clonePropColor(11984250);
      addValue.add(`plain`, new THREE.SphereGeometry(result2, 16, 12), {
        x: result4,
        y: result7 * 0.9,
        z: result5,
        sy: 0.88,
        ry: rangeValue.next() * propsState.propFullTurn,
        tint: varyPropColorResult,
        colorFn: (lerpValue, value4, value5, value6) => {
          let atan2Result = Math.atan2(value6 - result5, value4 - result4);
          lerpValue.lerp(
            clonePropColorResult,
            clampPropValue(Math.cos(atan2Result * 7) * 2.2 - 0.6) * 0.55,
          );
        },
      });
      addValue.add(`wood`, createBeveledPropCylinder(0.012, 0.05, 5, 0.004), {
        x: result4,
        y: result7 * 0.9 + result2 * 0.86,
        z: result5,
        rz: 0.4,
        tint: 7170606,
      });
      continue;
    }
    addValue.add(`plain`, new THREE.SphereGeometry(result2, 12, 9), {
      x: result4,
      y: result7,
      z: result5,
      sy: value3 === `cabbage` ? 0.9 : 0.93,
      tint: varyPropColorResult,
      colorFn:
        value3 === `apple`
          ? (lerpValue2, value7, value8) =>
              lerpValue2.lerp(
                clonePropColor(15909454),
                clampPropValue(((value8 - result7) / result2) * -1.2 - 0.2) * 0.35,
              )
          : undefined,
    });
    if (value3 === `apple` || value3 === `orange`) {
      addValue.add(`wood`, createBeveledPropCylinder(0.008, 0.04, 4, 0.003), {
        x: result4,
        y: result7 + result2 * 0.9,
        z: result5,
        rz: rangeValue.range(-0.4, 0.4),
        tint: value3 === `apple` ? 5913122 : 5204522,
      });
      if (rangeValue.chance(value3 === `apple` ? 0.45 : 0.25)) {
        addValue.add(`leaf`, createNoisyPropRock(0.028, 1, 0.1, 6, rangeValue.next() * 9, 0.3), {
          x: result4 + 0.02,
          y: result7 + result2 * 0.95,
          z: result5,
          rz: -0.6,
          sx: 1.6,
          tint: propsState.propPalette.leaf,
        });
      }
    }
  }
}
