/** Sky lifecycle, state and controls, light sampling, exposure and stabilized shadow camera updates. */
import * as THREE from "three";
import { skyState } from "../state.js";
import { sampleSkyCycle } from "../day-cycle/sample-sky-cycle.js";
import { getSkyToneMappingMode } from "../tone-mapping/get-sky-tone-mapping-mode.js";
import { getSunDirection } from "../celestial-orbits/get-sun-direction.js";
import { getMoonDirection } from "../celestial-orbits/get-moon-direction.js";
import { getSunElevationRadians } from "../celestial-orbits/get-sun-elevation-radians.js";
import { skyDisplayToSceneLinear } from "../tone-mapping/sky-display-to-scene-linear.js";
export function updateSkyLighting(value2) {
  let skyGameContextValue = skyState.skyGameContext;
  let timeOfDay2 = skyGameContextValue.timeOfDay;
  sampleSkyCycle(timeOfDay2, skyState.skyCurrentCycleSample);
  let renderer2 = skyGameContextValue.renderer;
  if (skyState.skyAutoExposureEnabled) {
    renderer2.toneMappingExposure = skyState.skyCurrentCycleSample.exp;
  }
  let skyToneMappingModeResult = getSkyToneMappingMode(renderer2);
  let result = renderer2.toneMappingExposure || 1;
  skyState.skyShaderUniforms.uTM.value = skyToneMappingModeResult;
  skyState.skyShaderUniforms.uExposure.value = result;
  getSunDirection(timeOfDay2, skyState.skySunDirection);
  getMoonDirection(timeOfDay2, skyState.skyMoonDirection);
  let sunElevationRadiansResult = getSunElevationRadians(timeOfDay2);
  skyState.skySunElevationRadians = sunElevationRadiansResult;
  let asinResult = Math.asin(skyState.skyMoonDirection.y);
  skyState.skyShaderUniforms.uZenith.value.copy(skyState.skyCurrentCycleSample.zenith);
  skyState.skyShaderUniforms.uMid.value.copy(skyState.skyCurrentCycleSample.mid);
  skyState.skyShaderUniforms.uMidAnti.value.copy(skyState.skyCurrentCycleSample.midAnti);
  skyState.skyShaderUniforms.uHorizon.value.copy(skyState.skyCurrentCycleSample.horizon);
  skyDisplayToSceneLinear(
    skyState.skyCurrentCycleSample.horizon,
    skyState.skyShaderUniforms.uFogLin.value,
    skyToneMappingModeResult,
    result,
  );
  skyDisplayToSceneLinear(
    skyState.skyCurrentCycleSample.sunHz,
    skyState.skyColorScratch,
    skyToneMappingModeResult,
    result,
  );
  let result2 = 1 - skyState.smoothSkyRange(sunElevationRadiansResult, 0.35, 0.9) * 0.6;
  skyState.skyShaderUniforms.uScatterLin.value.setRGB(
    (skyState.skyColorScratch.r - skyState.skyShaderUniforms.uFogLin.value.r) * result2,
    (skyState.skyColorScratch.g - skyState.skyShaderUniforms.uFogLin.value.g) * result2,
    (skyState.skyColorScratch.b - skyState.skyShaderUniforms.uFogLin.value.b) * result2,
  );
  skyState.skyHorizonColor.copy(skyState.skyShaderUniforms.uFogLin.value);
  skyState.skyFog.color.copy(skyState.skyShaderUniforms.uFogLin.value);
  skyState.skyFog.near = skyState.skyCurrentCycleSample.fogN;
  skyState.skyFog.far = skyState.skyCurrentCycleSample.fogF;
  skyState.skyGlobalShaderUniforms.fogSunDir[0] = skyState.skySunDirection.x;
  skyState.skyGlobalShaderUniforms.fogSunDir[1] = skyState.skySunDirection.y;
  skyState.skyGlobalShaderUniforms.fogSunDir[2] = skyState.skySunDirection.z;
  skyState.skyGlobalShaderUniforms.fogSunColor[0] = skyState.skyShaderUniforms.uScatterLin.value.r;
  skyState.skyGlobalShaderUniforms.fogSunColor[1] = skyState.skyShaderUniforms.uScatterLin.value.g;
  skyState.skyGlobalShaderUniforms.fogSunColor[2] = skyState.skyShaderUniforms.uScatterLin.value.b;
  skyState.skyColorScratch.copy(skyState.skyCurrentCycleSample.sun).convertSRGBToLinear();
  let lerpResult = THREE.MathUtils.lerp(
    3.2,
    32,
    skyState.smoothSkyRange(sunElevationRadiansResult, 0.06, 0.5),
  );
  let result3 = 1 / result;
  skyState.skyShaderUniforms.uSunDisc.value
    .copy(skyState.skyColorScratch)
    .multiplyScalar(
      (lerpResult * skyState.smoothSkyRange(sunElevationRadiansResult, -0.06, 0) + 1e-4) * result3,
    );
  skyState.skyShaderUniforms.uGlow.value
    .copy(skyState.skyCurrentCycleSample.glow)
    .convertSRGBToLinear()
    .multiplyScalar(skyState.skyCurrentCycleSample.glowK * 1.6 * result3);
  skyState.skyShaderUniforms.uCirrus.value.copy(skyState.skyCurrentCycleSample.cir);
  skyState.skyShaderUniforms.uCirrusA.value = skyState.skyCurrentCycleSample.cirA;
  skyState.skyShaderUniforms.uAltA.value =
    skyState.skyCurrentCycleSample.cirA *
    0.35 *
    (1 - skyState.smoothSkyRange(skyState.skySunDirection.y, 0.4, 0.5));
  skyState.skyShaderUniforms.uNight.value = skyState.skyCurrentCycleSample.stars;
  skyState.skyShaderUniforms.uSunSize.value = THREE.MathUtils.lerp(
    0.036,
    0.027,
    skyState.smoothSkyRange(sunElevationRadiansResult, 0, 0.35),
  );
  skyState.skyShaderUniforms.uTime.value = skyGameContextValue.time || 0;
  skyState.skyShaderUniforms.uPixelRatio.value = renderer2.getPixelRatio();
  skyState.skyStarRotationMatrix.makeRotationAxis(
    skyState.skyStarRotationAxis,
    timeOfDay2 * Math.PI * 2,
  );
  skyState.skyShaderUniforms.uStarRot.value.setFromMatrix4(skyState.skyStarRotationMatrix);
  skyState.skyShaderUniforms.uLit.value.copy(skyState.skyCurrentCycleSample.cLit);
  skyState.skyShaderUniforms.uShade.value.copy(skyState.skyCurrentCycleSample.cShade);
  skyState.skyShaderUniforms.uRimLin.value
    .copy(skyState.skyCurrentCycleSample.cRim)
    .convertSRGBToLinear()
    .multiplyScalar(
      THREE.MathUtils.lerp(
        0.5,
        2.2,
        skyState.smoothSkyRange(sunElevationRadiansResult, -0.1, 0.05),
      ) *
        (1 - 0.5 * skyState.smoothSkyRange(sunElevationRadiansResult, 0.4, 1)) *
        result3,
    );
  skyState.skyShaderUniforms.uDensity.value = THREE.MathUtils.lerp(
    1.9,
    1.3,
    skyState.smoothSkyRange(sunElevationRadiansResult, 0.12, 0.6),
  );
  skyState.skyShaderUniforms.uUnder.value
    .copy(skyState.skyCurrentCycleSample.sunHz)
    .lerp(skyState.skyCurrentCycleSample.glow, 0.45)
    .lerp(skyState.skyCurrentCycleSample.cLit, 0.2);
  skyState.skyShaderUniforms.uUnderK.value =
    skyState.smoothSkyRange(sunElevationRadiansResult, -0.17, -0.05) *
    (1 - skyState.smoothSkyRange(sunElevationRadiansResult, 0.03, 0.2)) *
    0.75;
  let smoothSkyRangeResult = skyState.smoothSkyRange(sunElevationRadiansResult, -0.22, -0.08);
  skyState.skyShaderUniforms.uCloudL.value
    .copy(skyState.skyMoonDirection)
    .lerp(skyState.skySunDirection, smoothSkyRangeResult)
    .normalize();
  skyState.skyDayFactor = skyState.smoothSkyRange(sunElevationRadiansResult, -0.035, 0.06);
  skyState.skyNightFactor = 1 - skyState.smoothSkyRange(sunElevationRadiansResult, -0.16, -0.035);
  let position;
  let result4;
  let result5;
  if (sunElevationRadiansResult > -0.035) {
    position = skyState.skySunDirection;
    result4 = skyState.skyDayFactor;
    result5 = skyState.skyMinimumSunLightElevation;
  } else {
    position = skyState.skyMoonDirection;
    result4 = skyState.skyNightFactor * skyState.smoothSkyRange(asinResult, 0.02, 0.25);
    result5 = THREE.MathUtils.degToRad(22);
  }
  let result6 = Math.max(Math.asin(THREE.MathUtils.clamp(position.y, -1, 1)), result5);
  let result7 = Math.hypot(position.x, position.z) || 1;
  skyState.skyKeyLightDirection.set(
    (position.x / result7) * Math.cos(result6),
    Math.sin(result6),
    (position.z / result7) * Math.cos(result6),
  );
  skyState.skyDirectionalLight.color.copy(skyState.skyCurrentCycleSample.sun).convertSRGBToLinear();
  skyState.skyDirectionalLight.intensity = skyState.skyCurrentCycleSample.sunI * result4;
  skyState.skyDirectionalLight.shadow.intensity =
    position === skyState.skySunDirection
      ? THREE.MathUtils.lerp(
          0.72,
          0.85,
          skyState.smoothSkyRange(sunElevationRadiansResult, 0.12, 0.45),
        )
      : 0.6;
  skyState.skyHemisphereLight.color.copy(skyState.skyCurrentCycleSample.hSky).convertSRGBToLinear();
  skyState.skyHemisphereLight.groundColor
    .copy(skyState.skyCurrentCycleSample.hGnd)
    .convertSRGBToLinear();
  skyState.skyHemisphereLight.intensity = skyState.skyCurrentCycleSample.hI;
  skyState.skyLightState = {
    t: timeOfDay2,
    sunElevation: skyState.skySunDirection.y,
    sunElevationRad: sunElevationRadiansResult,
    dayFactor: skyState.skyDayFactor,
    nightFactor: skyState.skyNightFactor,
    isNight: sunElevationRadiansResult < -0.05,
    sunDir: skyState.skySunDirection,
    moonDir: skyState.skyMoonDirection,
    lightDir: skyState.skyKeyLightDirection,
    sunColor: skyState.skyDirectionalLight.color,
    sunIntensity: skyState.skyDirectionalLight.intensity,
    hemiSky: skyState.skyHemisphereLight.color,
    hemiGround: skyState.skyHemisphereLight.groundColor,
    hemiIntensity: skyState.skyHemisphereLight.intensity,
    horizonColor: skyState.skyHorizonColor,
    fogColor: skyState.skyFog.color,
    fogNear: skyState.skyFog.near,
    fogFar: skyState.skyFog.far,
    zenithDisplay: skyState.skyCurrentCycleSample.zenith,
    horizonDisplay: skyState.skyCurrentCycleSample.horizon,
    starVisibility: skyState.skyCurrentCycleSample.stars,
  };
  let result8 =
    skyState.smoothSkyRange(sunElevationRadiansResult, -0.06, 0.04) *
    (1 - skyState.smoothSkyRange(sunElevationRadiansResult, 0.22, 0.45));
  skyState.skyLightState.golden = result8;
  skyState.skyLightState.bloomThresholdHint = 1 + 0.6 * result8;
  skyGameContextValue.lightState = skyState.skyLightState;
  if (skyGameContextValue.sky) {
    skyGameContextValue.sky.sunElevation = skyState.skySunDirection.y;
    skyGameContextValue.sky.dayFactor = skyState.skyDayFactor;
    skyGameContextValue.sky.nightFactor = skyState.skyNightFactor;
    skyGameContextValue.sky.goldenFactor = result8;
    skyGameContextValue.sky.bloomThresholdHint = skyState.skyLightState.bloomThresholdHint;
  }
}
