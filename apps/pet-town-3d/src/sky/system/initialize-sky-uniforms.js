/** Sky lifecycle, state and controls, light sampling, exposure and stabilized shadow camera updates. */
import * as THREE from "three";
import { skyState } from "../state.js";
export function initializeSkyUniforms(setup) {
  Object.assign(skyState.skyShaderUniforms, {
    uTM: {
      value: 1,
    },
    uExposure: {
      value: 1,
    },
    uZenith: {
      value: new THREE.Color(),
    },
    uMid: {
      value: new THREE.Color(),
    },
    uMidAnti: {
      value: new THREE.Color(),
    },
    uHorizon: {
      value: new THREE.Color(),
    },
    uFogLin: {
      value: new THREE.Color(),
    },
    uScatterLin: {
      value: new THREE.Color(),
    },
    uSunDir: {
      value: skyState.skySunDirection,
    },
    uMoonDir: {
      value: skyState.skyMoonDirection,
    },
    uSunDisc: {
      value: new THREE.Color(),
    },
    uGlow: {
      value: new THREE.Color(),
    },
    uCirrus: {
      value: new THREE.Color(),
    },
    uCirrusA: {
      value: 0.3,
    },
    uNight: {
      value: 0,
    },
    uTime: {
      value: 0,
    },
    uSunSize: {
      value: 0.028,
    },
    uMoonSize: {
      value: 0.042,
    },
    uStarRot: {
      value: new THREE.Matrix3(),
    },
    uMoonLight: {
      value: new THREE.Vector3(-0.9, 0.28, 0.33).normalize(),
    },
    uPixelRatio: {
      value: setup.renderer.getPixelRatio(),
    },
    uCloudL: {
      value: new THREE.Vector3(0, 1, 0),
    },
    uLit: {
      value: new THREE.Color(),
    },
    uShade: {
      value: new THREE.Color(),
    },
    uRimLin: {
      value: new THREE.Color(),
    },
    uVis: {
      value: 9e3,
    },
    uCloudAlpha: {
      value: 1,
    },
    uDensity: {
      value: 1.5,
    },
    uUnder: {
      value: new THREE.Color(),
    },
    uUnderK: {
      value: 0,
    },
    uAltA: {
      value: 0,
    },
  });
}
