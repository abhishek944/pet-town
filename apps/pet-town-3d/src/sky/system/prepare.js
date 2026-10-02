/** Sky lifecycle, state and controls, light sampling, exposure and stabilized shadow camera updates. */
import * as THREE from "three";
import { skyState } from "../state.js";
import { initializeSky } from "./initialize-sky.js";
import { updateSky } from "./update-sky.js";
import { createSkyCycleSample } from "../day-cycle/create-sky-cycle-sample.js";
export function prepareSkySystem() {
  skyState.skySystem = {
    get init() {
      return initializeSky;
    },
    get update() {
      return updateSky;
    },
  };
  skyState.skyShadowQualityPresets = {
    high: {
      map: 4096,
      half: 46,
    },
    med: {
      map: 2048,
      half: 40,
    },
    low: {
      map: 1024,
      half: 30,
    },
  };
  skyState.skyLowQualityShadowCastRadius = 20;
  skyState.skyMaximumShadowMapSize = 4096;
  skyState.skyMinimumSunLightElevation = THREE.MathUtils.degToRad(7);
  skyState.skyShadowHalfExtent = 46;
  skyState.skyShadowLightDistance = 160;
  skyState.skyActiveShadowQualityName = ``;
  skyState.skyCurrentCycleSample = createSkyCycleSample();
  skyState.skyShaderUniforms = {};
  skyState.skyTimeFrozen = false;
  skyState.skyCycleSeconds = 480;
  skyState.skyCloudShadowsEnabled = true;
  skyState.skyAutoExposureEnabled = true;
  skyState.skySunDirection = new THREE.Vector3();
  skyState.skyMoonDirection = new THREE.Vector3();
  skyState.skyKeyLightDirection = new THREE.Vector3();
  skyState.skyHorizonColor = new THREE.Color();
  skyState.skyColorScratch = new THREE.Color();
  skyState.skyStarRotationMatrix = new THREE.Matrix4();
  skyState.skyStarRotationAxis = new THREE.Vector3(0.25, 0.92, -0.3).normalize();
  skyState.skyShadowFocus = new THREE.Vector3();
  skyState.skyShadowRightVector = new THREE.Vector3();
  skyState.skyShadowUpVector = new THREE.Vector3();
  skyState.skyShadowViewDirection = new THREE.Vector3();
  skyState.skyInverseShadowMatrix = new THREE.Matrix4();
  skyState.skyCameraForwardVector = new THREE.Vector3();
  skyState.skyCameraGroundIntersection = new THREE.Vector3();
  skyState.skyIdentityWorldMatrix = new THREE.Matrix4();
  skyState.skyHiddenWorldMatrix = new THREE.Matrix4().makeScale(0, 0, 0);
  skyState.smoothSkyRange = THREE.MathUtils.smoothstep;
  skyState.skyLightState = null;
  skyState.skyDayFactor = 1;
  skyState.skyNightFactor = 0;
  skyState.skySunElevationRadians = 1;
}
