/** Seeded 2D and 3D simplex noise, fractal Brownian motion and ridged noise. */

import { mathState } from "../state.js";
export function createNoise3d(noise) {
  return function (value4, value5, value6) {
    let result29;
    let result30;
    let result31;
    let result32;
    let result33 = (value4 + value5 + value6) * mathState.simplexSkew3d;
    let result34 = Math.floor(value4 + result33);
    let result35 = Math.floor(value5 + result33);
    let result36 = Math.floor(value6 + result33);
    let result37 = (result34 + result35 + result36) * mathState.simplexUnskew3d;
    let result38 = value4 - (result34 - result37);
    let result39 = value5 - (result35 - result37);
    let result40 = value6 - (result36 - result37);
    let result41;
    let result42;
    let result43;
    let result44;
    let result45;
    let result46;
    if (result38 >= result39) {
      if (result39 >= result40) {
        result41 = 1;
        result42 = 0;
        result43 = 0;
        result44 = 1;
        result45 = 1;
        result46 = 0;
      } else {
        if (result38 >= result40) {
          result41 = 1;
          result42 = 0;
          result43 = 0;
          result44 = 1;
          result45 = 0;
          result46 = 1;
        } else {
          result41 = 0;
          result42 = 0;
          result43 = 1;
          result44 = 1;
          result45 = 0;
          result46 = 1;
        }
      }
    } else {
      if (result39 < result40) {
        result41 = 0;
        result42 = 0;
        result43 = 1;
        result44 = 0;
        result45 = 1;
        result46 = 1;
      } else {
        if (result38 < result40) {
          result41 = 0;
          result42 = 1;
          result43 = 0;
          result44 = 0;
          result45 = 1;
          result46 = 1;
        } else {
          result41 = 0;
          result42 = 1;
          result43 = 0;
          result44 = 1;
          result45 = 1;
          result46 = 0;
        }
      }
    }
    let result47 = result38 - result41 + mathState.simplexUnskew3d;
    let result48 = result39 - result42 + mathState.simplexUnskew3d;
    let result49 = result40 - result43 + mathState.simplexUnskew3d;
    let result50 = result38 - result44 + 2 * mathState.simplexUnskew3d;
    let result51 = result39 - result45 + 2 * mathState.simplexUnskew3d;
    let result52 = result40 - result46 + 2 * mathState.simplexUnskew3d;
    let result53 = result38 - 1 + 3 * mathState.simplexUnskew3d;
    let result54 = result39 - 1 + 3 * mathState.simplexUnskew3d;
    let result55 = result40 - 1 + 3 * mathState.simplexUnskew3d;
    let result56 = result34 & 255;
    let result57 = result35 & 255;
    let result58 = result36 & 255;
    let result59 = 0.6 - result38 * result38 - result39 * result39 - result40 * result40;
    if (result59 < 0) {
      result29 = 0;
    } else {
      let result63 =
        noise.gradientIndices[
          result56 + noise.permutationTable[result57 + noise.permutationTable[result58]]
        ] * 3;
      result59 *= result59;
      result29 =
        result59 *
        result59 *
        (mathState.simplexGradientVectors[result63] * result38 +
          mathState.simplexGradientVectors[result63 + 1] * result39 +
          mathState.simplexGradientVectors[result63 + 2] * result40);
    }
    let result60 = 0.6 - result47 * result47 - result48 * result48 - result49 * result49;
    if (result60 < 0) {
      result30 = 0;
    } else {
      let result64 =
        noise.gradientIndices[
          result56 +
            result41 +
            noise.permutationTable[
              result57 + result42 + noise.permutationTable[result58 + result43]
            ]
        ] * 3;
      result60 *= result60;
      result30 =
        result60 *
        result60 *
        (mathState.simplexGradientVectors[result64] * result47 +
          mathState.simplexGradientVectors[result64 + 1] * result48 +
          mathState.simplexGradientVectors[result64 + 2] * result49);
    }
    let result61 = 0.6 - result50 * result50 - result51 * result51 - result52 * result52;
    if (result61 < 0) {
      result31 = 0;
    } else {
      let result65 =
        noise.gradientIndices[
          result56 +
            result44 +
            noise.permutationTable[
              result57 + result45 + noise.permutationTable[result58 + result46]
            ]
        ] * 3;
      result61 *= result61;
      result31 =
        result61 *
        result61 *
        (mathState.simplexGradientVectors[result65] * result50 +
          mathState.simplexGradientVectors[result65 + 1] * result51 +
          mathState.simplexGradientVectors[result65 + 2] * result52);
    }
    let result62 = 0.6 - result53 * result53 - result54 * result54 - result55 * result55;
    if (result62 < 0) {
      result32 = 0;
    } else {
      let result66 =
        noise.gradientIndices[
          result56 + 1 + noise.permutationTable[result57 + 1 + noise.permutationTable[result58 + 1]]
        ] * 3;
      result62 *= result62;
      result32 =
        result62 *
        result62 *
        (mathState.simplexGradientVectors[result66] * result53 +
          mathState.simplexGradientVectors[result66 + 1] * result54 +
          mathState.simplexGradientVectors[result66 + 2] * result55);
    }
    return 32 * (result29 + result30 + result31 + result32);
  };
}
