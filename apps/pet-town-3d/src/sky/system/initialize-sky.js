import { initializeSkyUniforms } from "./initialize-sky-uniforms.js";
/** Sky lifecycle, state and controls, light sampling, exposure and stabilized shadow camera updates. */
import * as THREE from "three";
import { skyState } from "../state.js";
import { installSkyShaderPatches } from "../shader-patches/install-sky-shader-patches.js";
import { createSkyDome } from "../dome/create-sky-dome.js";
import { createSkyStars } from "../stars/create-sky-stars.js";
import { skyCloudField } from "../clouds/sky-cloud-field.js";
import { hideSkyDuringOverridePasses } from "./hide-sky-during-override-passes.js";
import { setSkyShadowExtent } from "./set-sky-shadow-extent.js";
import { updateSkyLighting } from "./update-sky-lighting.js";
export function initializeSky(context) {
  const setup = {
    context,
  };
  skyState.skyGameContext = setup.context;
  installSkyShaderPatches();
  ({ scene: setup.scene, renderer: setup.renderer, params: setup.params } = setup.context);
  setup.timeParameter = setup.params?.get(`t`);
  if (setup.timeParameter != null && setup.timeParameter !== `` && !isNaN(+setup.timeParameter)) {
    setup.context.timeOfDay = ((setup.timeParameter % 1) + 1) % 1;
    skyState.skyTimeFrozen = true;
  } else {
    if (typeof setup.context.timeOfDay != `number`) {
      setup.context.timeOfDay = 0.4;
    }
  }
  setup.cycleParameter = setup.params?.get(`cycle`);
  if (setup.cycleParameter && +setup.cycleParameter > 0) {
    skyState.skyCycleSeconds = +setup.cycleParameter;
  }
  if (setup.params?.get(`cloudshadow`) === `0`) {
    skyState.skyCloudShadowsEnabled = false;
  }
  if (setup.params?.has(`exposure`) || setup.params?.get(`autoexp`) === `0`) {
    skyState.skyAutoExposureEnabled = false;
  }
  initializeSkyUniforms(setup);
  skyState.skySceneGroup = new THREE.Group();
  skyState.skySceneGroup.name = `sky`;
  skyState.skyDomeMesh = createSkyDome(skyState.skyShaderUniforms);
  skyState.skyStarsPoints = createSkyStars(skyState.skyShaderUniforms);
  skyState.skyClouds = new skyCloudField(skyState.skyShaderUniforms);
  for (let result4 of [skyState.skyDomeMesh, skyState.skyStarsPoints, skyState.skyClouds.mesh]) {
    hideSkyDuringOverridePasses(result4);
    skyState.skySceneGroup.add(result4);
  }
  if (setup.params?.get(`clouds`) === `0`) {
    skyState.skyClouds.mesh.visible = false;
  }
  setup.scene.add(skyState.skySceneGroup);
  skyState.skyDirectionalLight = new THREE.DirectionalLight(16777215, 3);
  skyState.skyDirectionalLight.name = `sun`;
  skyState.skyDirectionalLight.castShadow = true;
  skyState.skyMaximumShadowMapSize = setup.renderer.capabilities.maxTextureSize || 4096;
  setup.shadowMapSize = Math.min(4096, skyState.skyMaximumShadowMapSize);
  skyState.skyDirectionalLight.shadow.mapSize.set(setup.shadowMapSize, setup.shadowMapSize);
  setSkyShadowExtent(46);
  skyState.skyDirectionalLight.shadow.bias = -2e-4;
  skyState.skyDirectionalLight.shadow.normalBias = 0.06;
  skyState.skyDirectionalLight.shadow.radius = 2.4;
  setup.scene.add(skyState.skyDirectionalLight, skyState.skyDirectionalLight.target);
  skyState.skyHemisphereLight = new THREE.HemisphereLight(16777215, 8947848, 1);
  skyState.skyHemisphereLight.name = `skyHemi`;
  setup.scene.add(skyState.skyHemisphereLight);
  skyState.skyFog = new THREE.Fog(16777215, 25, 280);
  setup.scene.fog = skyState.skyFog;
  setup.scene.background = null;
  setup.context.sun = skyState.skyDirectionalLight;
  setup.context.sky = {
    group: skyState.skySceneGroup,
    sun: skyState.skyDirectionalLight,
    hemi: skyState.skyHemisphereLight,
    fog: skyState.skyFog,
    clouds: skyState.skyClouds,
    uniforms: skyState.skyShaderUniforms,
    horizonColor: skyState.skyHorizonColor,
    sunDir: skyState.skySunDirection,
    moonDir: skyState.skyMoonDirection,
    lightDir: skyState.skyKeyLightDirection,
    setTime(value2, value3) {
      skyState.skyGameContext.timeOfDay = ((value2 % 1) + 1) % 1;
      if (value3 !== undefined) {
        skyState.skyTimeFrozen = !!value3;
      }
      updateSkyLighting(0);
    },
    getTime: () => skyState.skyGameContext.timeOfDay,
    freeze(value4 = true) {
      skyState.skyTimeFrozen = !!value4;
    },
    isFrozen: () => skyState.skyTimeFrozen,
    setCycleSeconds(value5) {
      if (value5 > 0) {
        skyState.skyCycleSeconds = value5;
      }
    },
    cloudShadows(value6 = true) {
      skyState.skyCloudShadowsEnabled = !!value6;
    },
    setAutoExposure(value7 = true) {
      skyState.skyAutoExposureEnabled = !!value7;
    },
    getLightState: () => skyState.skyLightState,
  };
  updateSkyLighting(0);
}
