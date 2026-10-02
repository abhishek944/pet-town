/** Wall shading, ivy, trailing vines, flower rosettes, cottage windows and gabled roof details. */
import * as THREE from "three";
import { propsState } from "../state.js";
import { createBeveledPropBox } from "../geometry/create-beveled-prop-box.js";
import { shadeBuildingColor } from "./shade-building-color.js";
import { appendLeafRosetteGeometry } from "./append-leaf-rosette-geometry.js";
import { appendGardenFlowerGeometry } from "../garden-geometry/append-garden-flower-geometry.js";
import { appendTrailingVineGeometry } from "./append-trailing-vine-geometry.js";
export function appendCottageWindowGeometry(values, rangeValue, wValue) {
  let result = wValue.w ?? 1;
  let result2 = wValue.h ?? 1.15;
  let result3 = wValue.trim ?? propsState.propPalette.trim;
  values.add(`glass`, createBeveledPropBox(result, result2, 0.08, 0.01), {
    z: 0,
    uv: {
      mode: `unit`,
    },
    noAO: true,
  });
  for (let result4 of [-1, 1]) {
    values.add(`paint`, createBeveledPropBox(result + 0.28, 0.14, 0.16, 0.035), {
      y: result4 * (result2 / 2 + 0.07),
      z: 0.06,
      tint: result3,
    });
    values.add(`paint`, createBeveledPropBox(0.14, result2, 0.16, 0.035), {
      x: result4 * (result / 2 + 0.07),
      z: 0.06,
      tint: result3,
      uv: {
        grain: 1,
      },
    });
  }
  if (
    (values.add(`paint`, createBeveledPropBox(0.07, result2, 0.07, 0.015), {
      z: 0.06,
      tint: result3,
      uv: {
        grain: 1,
      },
    }),
    values.add(`paint`, createBeveledPropBox(result, 0.07, 0.07, 0.015), {
      y: result2 * 0.08,
      z: 0.06,
      tint: result3,
    }),
    wValue.box ||
      values.add(`wood`, createBeveledPropBox(result + 0.5, 0.1, 0.32, 0.035), {
        y: -(result2 / 2 + 0.17),
        z: 0.13,
        tint: wValue.sill ?? propsState.propPalette.timber,
      }),
    wValue.header !== false &&
      values.add(`wood`, createBeveledPropBox(result + 0.46, 0.17, 0.2, 0.04), {
        y: result2 / 2 + 0.22,
        z: 0.07,
        tint: wValue.headerTint ?? propsState.propPalette.timber,
      }),
    wValue.shutter)
  ) {
    let result5 = result * 0.5;
    for (let result6 of [-1, 1]) {
      let result7 = result6 * (result / 2 + 0.16 + result5 / 2);
      values.add(`paint`, createBeveledPropBox(result5, result2 + 0.12, 0.07, 0.022), {
        x: result7,
        z: 0.05,
        tint: wValue.shutter,
        jitter: 0.03,
        uv: {
          grain: 1,
          scale: 1 / 1.4,
        },
      });
      for (let result8 of [-0.3, 0.3]) {
        values.add(`paint`, createBeveledPropBox(result5 * 0.86, 0.09, 0.035, 0.012), {
          x: result7,
          y: result8 * result2,
          z: 0.1,
          tint: shadeBuildingColor(wValue.shutter, 0.82),
        });
      }
      values.push(result7, result2 * 0.02, 0.095);
      for (let result9 of [-1, 1]) {
        values.add(`plain`, new THREE.SphereGeometry(0.045, 8, 6), {
          x: result9 * 0.035,
          y: 0.02,
          sz: 0.25,
          tint: 3811872,
          noAO: true,
        });
      }
      values.add(`plain`, new THREE.ConeGeometry(0.07, 0.08, 4), {
        y: -0.035,
        rz: Math.PI,
        sz: 0.25,
        sx: 1.05,
        tint: 3811872,
        noAO: true,
      });
      values.pop();
    }
  }
  if (wValue.box) {
    let result10 = result + 0.36;
    let result11 = -(result2 / 2 + 0.14 + 0.15);
    values.add(`paint`, createBeveledPropBox(result10, 0.3, 0.34, 0.04), {
      y: result11,
      z: 0.18,
      tint: wValue.box,
      uv: {
        grain: 0,
      },
    });
    values.add(`paint`, createBeveledPropBox(result10 + 0.08, 0.05, 0.4, 0.015), {
      y: result11 + 0.165,
      z: 0.18,
      tint: shadeBuildingColor(wValue.box, 0.85),
    });
    for (let result12 of [-1, 1]) {
      values.add(`wood`, createBeveledPropBox(0.05, 0.12, 0.2, 0.01), {
        x: result12 * (result10 / 2 - 0.12),
        y: result11 - 0.2,
        z: 0.1,
        tint: propsState.propPalette.woodDark,
      });
    }
    values.add(`soil`, createBeveledPropBox(result10 - 0.12, 0.05, 0.24, 0.02), {
      y: result11 + 0.14,
      z: 0.18,
    });
    let values2 = wValue.flowerCols ?? [
      propsState.propPalette.pink,
      16777215,
      propsState.propPalette.lilac,
    ];
    for (let index = 0; index < 6; index++) {
      let result13 = -result10 / 2 + 0.14 + ((index + 0.5) * (result10 - 0.28)) / 6;
      appendLeafRosetteGeometry(values, rangeValue, result13, result11 + 0.15, 0.2, 0.62, 5);
      appendGardenFlowerGeometry(
        values,
        rangeValue,
        result13 + rangeValue.range(-0.05, 0.05),
        0.2 + rangeValue.range(-0.05, 0.05),
        {
          y: result11 + 0.14,
          h: rangeValue.range(0.16, 0.28),
          color: values2[index % values2.length],
        },
      );
    }
    for (let result14 of [-0.32, 0.05, 0.36]) {
      appendTrailingVineGeometry(
        values,
        rangeValue,
        result14 * result10,
        result11 + 0.13,
        0.36,
        rangeValue.range(0.22, 0.36),
        0,
        6,
      );
    }
  }
}
