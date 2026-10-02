/** Seeded 2D and 3D simplex noise, fractal Brownian motion and ridged noise. */

import { mathState } from "../state.js";
export function createNoise2d(noise) {
  return function (value2, value3) {
    let index3 = 0;
    let index4 = 0;
    let index5 = 0;
    let result9 = (value2 + value3) * mathState.simplexSkew2d;
    let result10 = Math.floor(value2 + result9);
    let result11 = Math.floor(value3 + result9);
    let result12 = (result10 + result11) * mathState.simplexUnskew2d;
    let result13 = value2 - (result10 - result12);
    let result14 = value3 - (result11 - result12);
    let result15 = +(result13 > result14);
    let result16 = result13 > result14 ? 0 : 1;
    let result17 = result13 - result15 + mathState.simplexUnskew2d;
    let result18 = result14 - result16 + mathState.simplexUnskew2d;
    let result19 = result13 - 1 + 2 * mathState.simplexUnskew2d;
    let result20 = result14 - 1 + 2 * mathState.simplexUnskew2d;
    let result21 = result10 & 255;
    let result22 = result11 & 255;
    let result23 = 0.5 - result13 * result13 - result14 * result14;
    if (result23 >= 0) {
      let result26 = noise.gradientIndices[result21 + noise.permutationTable[result22]] * 3;
      result23 *= result23;
      index3 =
        result23 *
        result23 *
        (mathState.simplexGradientVectors[result26] * result13 +
          mathState.simplexGradientVectors[result26 + 1] * result14);
    }
    let result24 = 0.5 - result17 * result17 - result18 * result18;
    if (result24 >= 0) {
      let result27 =
        noise.gradientIndices[result21 + result15 + noise.permutationTable[result22 + result16]] *
        3;
      result24 *= result24;
      index4 =
        result24 *
        result24 *
        (mathState.simplexGradientVectors[result27] * result17 +
          mathState.simplexGradientVectors[result27 + 1] * result18);
    }
    let result25 = 0.5 - result19 * result19 - result20 * result20;
    if (result25 >= 0) {
      let result28 = noise.gradientIndices[result21 + 1 + noise.permutationTable[result22 + 1]] * 3;
      result25 *= result25;
      index5 =
        result25 *
        result25 *
        (mathState.simplexGradientVectors[result28] * result19 +
          mathState.simplexGradientVectors[result28 + 1] * result20);
    }
    return 70 * (index3 + index4 + index5);
  };
}
