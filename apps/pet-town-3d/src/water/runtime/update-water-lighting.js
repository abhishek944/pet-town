/** Water lifecycle, terrain rebaking, dynamic reflections/refraction, ripples, splashes, and public water API. */

import { waterState } from "../state.js";
import { copyWaterColor } from "./copy-water-color.js";
export function updateWaterLighting(frame) {
  frame.sun = frame.context.sun;
  frame.sky = frame.context.sky ?? {};
  if (frame.sun) {
    frame.sun.getWorldPosition(waterState.waterRuntimeState.tmpA);
    if (frame.sun.target) {
      frame.sun.target.getWorldPosition(waterState.waterRuntimeState.tmpB);
    } else {
      waterState.waterRuntimeState.tmpB.set(0, 0, 0);
    }
    let result5 = waterState.waterRuntimeState.tmpA.sub(waterState.waterRuntimeState.tmpB);
    if (result5.lengthSq() > 1e-6) {
      frame.uniforms.uLightDir.value.copy(result5).normalize();
    }
  } else {
    if (frame.sky.lightDir?.isVector3) {
      frame.uniforms.uLightDir.value.copy(frame.sky.lightDir).normalize();
    }
  }
  frame.isNight = frame.context.lightState?.isNight ?? frame.sky.nightFactor > 0.5;
  frame.celestialDirection = frame.isNight ? frame.sky.moonDir : frame.sky.sunDir;
  if (frame.celestialDirection?.isVector3 && frame.celestialDirection.lengthSq() > 1e-6) {
    frame.uniforms.uSunDir.value.copy(frame.celestialDirection).normalize();
  } else {
    frame.uniforms.uSunDir.value.copy(frame.uniforms.uLightDir.value);
  }
  if (frame.sun?.color) {
    frame.uniforms.uSunColor.value.copy(frame.sun.color).multiplyScalar(frame.sun.intensity ?? 1);
  }
  frame.nightFactor =
    frame.sky.nightFactor ?? frame.context.lightState?.nightFactor ?? +!!frame.isNight;
  frame.uniforms.uNight.value = Math.min(1, Math.max(0, frame.nightFactor));
  frame.uniforms.uDeep.value
    .copy(waterState.waterRuntimeState.dayDeep)
    .lerp(waterState.waterRuntimeState.nightDeep, frame.uniforms.uNight.value);
  frame.uniforms.uMid.value
    .copy(waterState.waterRuntimeState.dayMid)
    .lerp(waterState.waterRuntimeState.nightMid, frame.uniforms.uNight.value);
  frame.horizonColor = frame.uniforms.uSkyHorizon.value;
  frame.zenithColor = frame.uniforms.uSkyZenith.value;
  if (!(
    copyWaterColor(frame.sky.horizonColor, frame.horizonColor) ||
    copyWaterColor(
      frame.context.scene.background?.isColor ? frame.context.scene.background : null,
      frame.horizonColor,
    )
  )) {
    copyWaterColor(frame.context.scene.fog?.color, frame.horizonColor);
  }
  frame.zenithDisplay = frame.context.lightState?.zenithDisplay;
  frame.horizonDisplay = frame.context.lightState?.horizonDisplay;
  if (!copyWaterColor(frame.sky.zenithColor ?? frame.sky.topColor, frame.zenithColor)) {
    if (frame.zenithDisplay?.isColor && frame.horizonDisplay?.isColor) {
      let callback = (value5) =>
        value5 <= 0.04045 ? value5 / 12.92 : ((value5 + 0.055) / 1.055) ** 2.4;
      let callback2 = (value6, value7) => (callback(value7) > 1e-4 ? value6 / callback(value7) : 1);
      frame.zenithColor.setRGB(
        callback(frame.zenithDisplay.r) * callback2(frame.horizonColor.r, frame.horizonDisplay.r),
        callback(frame.zenithDisplay.g) * callback2(frame.horizonColor.g, frame.horizonDisplay.g),
        callback(frame.zenithDisplay.b) * callback2(frame.horizonColor.b, frame.horizonDisplay.b),
      );
    } else {
      frame.zenithColor
        .copy(frame.horizonColor)
        .multiply(waterState.waterRuntimeState.tmpC.setRGB(0.55, 0.78, 1));
    }
  }
}
