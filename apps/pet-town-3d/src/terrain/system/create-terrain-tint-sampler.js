/** Editable terrain lifecycle, chunks, water masks, raycasting, custom blocks, block icons and lighting updates. */

import { clampTerrainTint } from "./clamp-terrain-tint.js";
import { terrainState } from "../state.js";
export function createTerrainTintSampler(state) {
  return (
    value11,
    value12,
    value13,
    value14,
    value15,
    value16,
    value17,
    value18 = 1,
    value19 = 0,
  ) => {
    let fbm2Result = state.tintNoise.fbm2(value12 * 0.03, value14 * 0.03, 2);
    let noise2Result = state.tintNoise.noise2(
      value12 * 0.11 + value13 * 0.17,
      value14 * 0.11 - value13 * 0.13,
    );
    let result29 = 1;
    let result30 = 1;
    let result31 = 1;
    if (value11 === `grass`) {
      let result34 = Math.max(
        -1,
        Math.min(1, state.tintNoise.fbm2(value12 * 0.015 + 31, value14 * 0.015 - 12, 2) * 1.8),
      );
      if (result34 > 0) {
        result29 += 0.08 * result34;
        result30 += 0.02 * result34;
        result31 -= 0.07 * result34;
      } else {
        result29 += 0.08 * result34;
        result30 -= 0.01 * result34;
        result31 -= 0.09 * result34;
      }
      let clampTerrainTintResult = clampTerrainTint(fbm2Result * 1.9);
      let clampTerrainTintResult2 = clampTerrainTint(-fbm2Result * 1.9);
      result29 *= 1 + 0.07 * clampTerrainTintResult - 0.04 * clampTerrainTintResult2;
      result30 *= 1 + 0.02 * clampTerrainTintResult;
      result31 *= 1 - 0.1 * clampTerrainTintResult + 0.06 * clampTerrainTintResult2;
      let clampTerrainTintResult3 = clampTerrainTint(
        (state.tintNoise.fbm2(value12 * 0.045 - 8, value14 * 0.045 + 2, 3) - 0.02) * 4,
      );
      result29 *= 1 - 0.12 * clampTerrainTintResult3;
      result30 *= 1 - 0.05 * clampTerrainTintResult3;
      result31 *= 1 + 0.02 * clampTerrainTintResult3;
      let clampTerrainTintResult4 = clampTerrainTint((value13 - 12) / 14);
      result29 *= 1 + 0.03 * clampTerrainTintResult4;
      result31 *= 1 + 0.06 * clampTerrainTintResult4;
      let noise2Result2 = state.tintNoise.noise2(value12 * 0.23 + 3.1, value14 * 0.23 - 1.7);
      let result35 = 1 + 0.07 * noise2Result + 0.035 * noise2Result2;
      result29 *= result35;
      result30 *= result35;
      result31 *= result35;
    } else {
      let result36 = 1 + 0.08 * noise2Result + 0.05 * fbm2Result;
      if (
        ((result29 = result36 * (1 + 0.03 * fbm2Result)),
        (result30 = result36),
        (result31 = result36 * (1 - 0.03 * fbm2Result)),
        value11 === `sand` && value13 >= 6.92)
      ) {
        let result37 =
          1 - clampTerrainTint((value13 - terrainState.terrainWaterLevel - 0.05) / 0.3);
        result29 *= 1 - 0.14 * result37;
        result30 *= 1 - 0.15 * result37;
        result31 *= 1 - 0.17 * result37;
      }
    }
    if (value15 !== 2 && value15 !== 3 && value19 > 0.5) {
      let result38 = Math.min(1, value19 / 3);
      let value18Value = value18;
      let result39 = 0.8 + 0.25 * value18Value;
      let result40 = 0.84 + 0.19 * value18Value;
      let result41 = 0.93 + 0.06 * value18Value;
      result29 *= 1 + (result39 - 1) * result38;
      result30 *= 1 + (result40 - 1) * result38;
      result31 *= 1 + (result41 - 1) * result38;
    }
    let result32 = value15 === 2 ? 1 + (value16 - 0.5) * 0.06 : 1;
    result29 *= result32;
    result30 *= result32;
    result31 *= result32;
    let result33 = terrainState.terrainWaterLevel - value13;
    if (result33 > 0) {
      let clampTerrainTintResult5 = clampTerrainTint(0.3 + result33 / 2.6);
      result29 *= 1 - 0.42 * clampTerrainTintResult5;
      result30 *= 1 - 0.16 * clampTerrainTintResult5;
      result31 *= 1 - 0.06 * clampTerrainTintResult5;
    }
    value17[0] = result29;
    value17[1] = result30;
    value17[2] = result31;
  };
}
