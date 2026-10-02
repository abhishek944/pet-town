/** CPU inverse tone mapping and display-to-scene color conversion. */
import { skySrgbChannelToLinear } from "./sky-srgb-channel-to-linear.js";
import { skyState } from "../state.js";
import { invertSkyAcesCurve } from "./invert-sky-aces-curve.js";
export function skyDisplayToSceneLinear(color, setRGBValue, value, value2) {
  let skySrgbChannelToLinearResult = skySrgbChannelToLinear(color.r);
  let skySrgbChannelToLinearResult2 = skySrgbChannelToLinear(color.g);
  let skySrgbChannelToLinearResult3 = skySrgbChannelToLinear(color.b);
  if (value === skyState.skyToneMappingModes.ACES) {
    skyState.skyToneMapScratchVector
      .set(
        skySrgbChannelToLinearResult,
        skySrgbChannelToLinearResult2,
        skySrgbChannelToLinearResult3,
      )
      .applyMatrix3(skyState.skyInverseAcesOutputMatrix);
    let callback = (value3) => Math.min(Math.max(value3, 0), skyState.skyInverseToneMapCeiling);
    skyState.skyToneMapScratchVector
      .set(
        invertSkyAcesCurve(callback(skyState.skyToneMapScratchVector.x)),
        invertSkyAcesCurve(callback(skyState.skyToneMapScratchVector.y)),
        invertSkyAcesCurve(callback(skyState.skyToneMapScratchVector.z)),
      )
      .applyMatrix3(skyState.skyInverseAcesInputMatrix);
    let result = 0.6 / value2;
    return setRGBValue.setRGB(
      Math.max(skyState.skyToneMapScratchVector.x, 0) * result,
      Math.max(skyState.skyToneMapScratchVector.y, 0) * result,
      Math.max(skyState.skyToneMapScratchVector.z, 0) * result,
    );
  }
  if (value === skyState.skyToneMappingModes.NEUTRAL) {
    let result2 = 0.76;
    let result3 = 0.24;
    let callback2 = (value4) => Math.min(Math.max(value4, 0), skyState.skyInverseToneMapCeiling);
    skySrgbChannelToLinearResult = callback2(skySrgbChannelToLinearResult);
    skySrgbChannelToLinearResult2 = callback2(skySrgbChannelToLinearResult2);
    skySrgbChannelToLinearResult3 = callback2(skySrgbChannelToLinearResult3);
    let result4 = Math.max(
      skySrgbChannelToLinearResult,
      skySrgbChannelToLinearResult2,
      skySrgbChannelToLinearResult3,
    );
    if (result4 > result2) {
      let result7 = ((result3 * result3) / (1 - result4) - result3 + result2) / result4;
      skySrgbChannelToLinearResult *= result7;
      skySrgbChannelToLinearResult2 *= result7;
      skySrgbChannelToLinearResult3 *= result7;
    }
    let result5 = Math.min(
      skySrgbChannelToLinearResult,
      skySrgbChannelToLinearResult2,
      skySrgbChannelToLinearResult3,
    );
    let result6 =
      (result5 >= 0.04 ? result5 + 0.04 : Math.sqrt(Math.max(result5, 0) / 6.25)) - result5;
    return setRGBValue.setRGB(
      (skySrgbChannelToLinearResult + result6) / value2,
      (skySrgbChannelToLinearResult2 + result6) / value2,
      (skySrgbChannelToLinearResult3 + result6) / value2,
    );
  }
  return value === skyState.skyToneMappingModes.LINEAR
    ? setRGBValue.setRGB(
        skySrgbChannelToLinearResult / value2,
        skySrgbChannelToLinearResult2 / value2,
        skySrgbChannelToLinearResult3 / value2,
      )
    : setRGBValue.setRGB(
        skySrgbChannelToLinearResult,
        skySrgbChannelToLinearResult2,
        skySrgbChannelToLinearResult3,
      );
}
