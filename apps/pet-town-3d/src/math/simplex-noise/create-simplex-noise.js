import { createNoise3d } from "./create-noise-3d.js";
import { createNoise2d } from "./create-noise-2d.js";
/** Seeded 2D and 3D simplex noise, fractal Brownian motion and ridged noise. */
import { createSeededRandom } from "../random/create-seeded-random.js";
export function createSimplexNoise(seed = 1) {
  const noise = {
    seed,
  };
  noise.noise2 = createNoise2d(noise);
  noise.noise3 = createNoise3d(noise);
  noise.fbm2 = function (value7, value8, value9 = 4, value10 = 2, value11 = 0.5) {
    let result67 = 1;
    let result68 = 1;
    let index6 = 0;
    let index7 = 0;
    for (let index8 = 0; index8 < value9; index8++) {
      index6 +=
        result67 *
        noise.noise2(value7 * result68 + index8 * 17.13, value8 * result68 - index8 * 9.71);
      index7 += result67;
      result67 *= value11;
      result68 *= value10;
    }
    return index6 / index7;
  };
  noise.ridged2 = function (value12, value13, value14 = 4, value15 = 2, value16 = 0.5) {
    let result69 = 1;
    let result70 = 1;
    let index9 = 0;
    let index10 = 0;
    let result71 = 1;
    for (let index11 = 0; index11 < value14; index11++) {
      let result72 =
        1 -
        Math.abs(
          noise.noise2(value12 * result70 + index11 * 31.7, value13 * result70 + index11 * 7.3),
        );
      result72 *= result72;
      index9 += result72 * result69 * result71;
      result71 = result72;
      index10 += result69;
      result69 *= value16;
      result70 *= value15;
    }
    return index9 / index10;
  };
  noise.fbm3 = function (value17, value18, value19, value20 = 3) {
    let result73 = 1;
    let result74 = 1;
    let index12 = 0;
    let index13 = 0;
    for (let index14 = 0; index14 < value20; index14++) {
      index12 +=
        result73 * noise.noise3(value17 * result74, value18 * result74, value19 * result74);
      index13 += result73;
      result73 *= 0.5;
      result74 *= 2;
    }
    return index12 / index13;
  };
  noise.random = createSeededRandom(noise.seed);
  noise.permutation = new Uint8Array(256);
  for (let index = 0; index < 256; index++) {
    noise.permutation[index] = index;
  }
  for (let result6 = 255; result6 > 0; result6--) {
    let result7 = Math.floor(noise.random() * (result6 + 1));
    let result8 = noise.permutation[result6];
    noise.permutation[result6] = noise.permutation[result7];
    noise.permutation[result7] = result8;
  }
  noise.permutationTable = new Uint8Array(512);
  noise.gradientIndices = new Uint8Array(512);
  for (let index2 = 0; index2 < 512; index2++) {
    noise.permutationTable[index2] = noise.permutation[index2 & 255];
    noise.gradientIndices[index2] = noise.permutationTable[index2] % 12;
  }
  return {
    noise2: noise.noise2,
    noise3: noise.noise3,
    fbm2: noise.fbm2,
    ridged2: noise.ridged2,
    fbm3: noise.fbm3,
  };
}
