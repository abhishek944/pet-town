/** Windmill tower and separately animated sail geometry. */

import { mixPropScalar } from "../math/mix-prop-scalar.js";
import { createPropLathe } from "../geometry/create-prop-lathe.js";
import { propsState } from "../state.js";
import { propFractalNoise3d } from "../math/prop-fractal-noise3d.js";
import { propSmoothstep } from "../math/prop-smoothstep.js";
import { createBeveledPropBox } from "../geometry/create-beveled-prop-box.js";
export function buildWindmillWalls(windmill) {
  windmill.wallProfile = [];
  for (let result8 = 0.6; result8 < windmill.towerHeight; result8 += 0.42) {
    windmill.wallProfile.push([windmill.radiusAtHeight(result8), result8]);
  }
  windmill.wallProfile.push([windmill.topRadius, windmill.towerHeight], [0, windmill.towerHeight]);
  windmill.builder.add(`paint`, createPropLathe(windmill.wallProfile, 8, true, Math.PI / 8), {
    tint: windmill.settings.wall ?? 16510683,
    uv: {
      mode: `native`,
      su: (propsState.buildingFullTurn * 1.75) / 2,
      sv: 6.2 / 2,
    },
    colorFn: (multiplyScalarValue, value3, value4, value5) => {
      let result9 =
        propFractalNoise3d(Math.atan2(value3, value5) * 3.2, value4 * 0.35, 1.7, 2) - 0.5;
      let result10 = propFractalNoise3d(value3 * 1.3, value4 * 1.3, value5 * 1.3, 2) - 0.5;
      multiplyScalarValue.multiplyScalar(
        mixPropScalar(0.78, 1, propSmoothstep(0.6, 1.8, value4)) *
          mixPropScalar(1, 0.8, propSmoothstep(5.8999999999999995, windmill.towerHeight, value4)) *
          (1 + result9 * 0.14 + result10 * 0.08),
      );
      multiplyScalarValue.r *= 1 + result10 * 0.06;
      multiplyScalarValue.b *= 1 - result10 * 0.08;
    },
  });
  for (let result11 of [0.62, 3.3, 6.66]) {
    let result12 = windmill.radiusAtHeight(result11) + 0.06;
    windmill.builder.add(
      `wood`,
      createPropLathe(
        [
          [result12 - 0.1, 0],
          [result12, 0.01],
          [result12, 0.22],
          [result12 - 0.1, 0.23],
        ],
        8,
        true,
        Math.PI / 8,
      ),
      {
        y: result11 - 0.1,
        tint: propsState.propPalette.timber,
        uv: {
          mode: `native`,
          su: 4,
          sv: 0.2,
        },
      },
    );
  }
  for (let index = 0; index < 8; index++) {
    let result13 = (index / 8) * propsState.buildingFullTurn + Math.PI / 8;
    let result14 = Math.sin(result13) * 2.07;
    let result15 = Math.cos(result13) * 2.07;
    let result16 = Math.sin(result13) * 1.42;
    let result17 = Math.cos(result13) * 1.42;
    let hypotResult = Math.hypot(result16 - result14, 6.2, result17 - result15);
    let atan2Result2 = Math.atan2(0.6499999999999999, 6.2);
    windmill.builder.push(
      (result14 + result16) / 2,
      7.3999999999999995 / 2,
      (result15 + result17) / 2,
      0,
      result13,
      0,
    );
    windmill.builder.add(`wood`, createBeveledPropBox(0.16, hypotResult, 0.16, 0.04), {
      rx: -atan2Result2,
      tint: propsState.propPalette.timber,
      uv: {
        grain: 1,
      },
    });
    windmill.builder.pop();
  }
}
