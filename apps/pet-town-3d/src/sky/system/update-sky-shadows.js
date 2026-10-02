/** Sky lifecycle, state and controls, light sampling, exposure and stabilized shadow camera updates. */
import { skyState } from "../state.js";
import { setSkyShadowExtent } from "./set-sky-shadow-extent.js";
export function updateSkyShadows(cameraValue) {
  let camera2 = cameraValue.camera;
  let position2 = cameraValue.player?.position;
  let result = position2 && Number.isFinite(position2.x);
  if (result) {
    skyState.skyShadowFocus.set(position2.x, position2.y, position2.z);
  } else {
    skyState.skyShadowFocus.set(0, 0, 0);
  }
  let tier2 = cameraValue.post?.tier;
  let result2 = tier2?.name ?? `high`;
  let result3 = skyState.skyShadowQualityPresets[result2] ?? skyState.skyShadowQualityPresets.high;
  let result4 = Math.min(tier2?.shadowMap ?? result3.map, skyState.skyMaximumShadowMapSize);
  let result5 = tier2?.shadowHalf ?? result3.half;
  if (result4 !== skyState.skyDirectionalLight.shadow.mapSize.x) {
    skyState.skyDirectionalLight.shadow.mapSize.set(result4, result4);
    if (skyState.skyDirectionalLight.shadow.map) {
      skyState.skyDirectionalLight.shadow.map.dispose();
      skyState.skyDirectionalLight.shadow.map = null;
    }
  }
  if (result2 !== skyState.skyActiveShadowQualityName) {
    skyState.skyActiveShadowQualityName = result2;
    if (cameraValue.sky) {
      cameraValue.sky.shadowCastRadius =
        result2 === `low` ? skyState.skyLowQualityShadowCastRadius : 1 / 0;
    }
  }
  let result6 = result ? position2.y : 5;
  let result7 = Math.max(0, camera2.position.y - result6);
  let result8 = Math.min(
    result5 * 2.6,
    Math.max(result5, Math.ceil((camera2.position.y * 1.3) / 8) * 8),
  );
  if (
    (result8 !== skyState.skyShadowHalfExtent && setSkyShadowExtent(result8),
    camera2.getWorldDirection(skyState.skyCameraForwardVector),
    skyState.skyCameraForwardVector.y < -0.05)
  ) {
    let result14 = Math.min(
      (camera2.position.y - result6) / -skyState.skyCameraForwardVector.y,
      400,
    );
    skyState.skyCameraGroundIntersection
      .copy(camera2.position)
      .addScaledVector(skyState.skyCameraForwardVector, result14);
    let result15 = result ? skyState.smoothSkyRange(result7, 25, 70) : 1;
    skyState.skyShadowFocus.lerp(skyState.skyCameraGroundIntersection, result15);
  }
  skyState.skyShadowViewDirection.copy(skyState.skyKeyLightDirection).negate();
  skyState.skyShadowUpVector.set(0, 1, 0);
  if (Math.abs(skyState.skyShadowViewDirection.y) > 0.99) {
    skyState.skyShadowUpVector.set(0, 0, 1);
  }
  skyState.skyShadowRightVector
    .crossVectors(skyState.skyShadowUpVector, skyState.skyShadowViewDirection)
    .normalize();
  skyState.skyShadowUpVector
    .crossVectors(skyState.skyShadowViewDirection, skyState.skyShadowRightVector)
    .normalize();
  let result9 = (2 * skyState.skyShadowHalfExtent) / skyState.skyDirectionalLight.shadow.mapSize.x;
  let result10 = skyState.skyShadowFocus.dot(skyState.skyShadowRightVector);
  let result11 = skyState.skyShadowFocus.dot(skyState.skyShadowUpVector);
  skyState.skyShadowFocus
    .addScaledVector(
      skyState.skyShadowRightVector,
      Math.round(result10 / result9) * result9 - result10,
    )
    .addScaledVector(
      skyState.skyShadowUpVector,
      Math.round(result11 / result9) * result9 - result11,
    );
  skyState.skyDirectionalLight.target.position.copy(skyState.skyShadowFocus);
  skyState.skyDirectionalLight.position
    .copy(skyState.skyShadowFocus)
    .addScaledVector(skyState.skyKeyLightDirection, skyState.skyShadowLightDistance);
  skyState.skyDirectionalLight.target.updateMatrixWorld();
  skyState.skyDirectionalLight.updateMatrixWorld();
  skyState.skyDirectionalLight.shadow.updateMatrices(skyState.skyDirectionalLight);
  if (cameraValue.sky) {
    cameraValue.sky.shadowFocus = skyState.skyShadowFocus;
  }
  let result12 = skyState.skyCloudShadowsEnabled && skyState.skyClouds.mesh.visible;
  skyState.skyInverseShadowMatrix.copy(skyState.skyDirectionalLight.shadow.matrix).invert();
  skyState.skyGlobalShaderUniforms.skyCloudShadowInv.set(skyState.skyInverseShadowMatrix.elements);
  skyState.skyGlobalShaderUniforms.skyCloudShadowL[0] = skyState.skyKeyLightDirection.x;
  skyState.skyGlobalShaderUniforms.skyCloudShadowL[1] = skyState.skyKeyLightDirection.y;
  skyState.skyGlobalShaderUniforms.skyCloudShadowL[2] = skyState.skyKeyLightDirection.z;
  skyState.skyGlobalShaderUniforms.skyCloudShadowL[3] = 140;
  let result13 = cameraValue.time || 0;
  skyState.skyGlobalShaderUniforms.skyCloudShadowW[0] = -skyState.skyClouds.wind.x * 0.6 * result13;
  skyState.skyGlobalShaderUniforms.skyCloudShadowW[1] = -skyState.skyClouds.wind.z * 0.6 * result13;
  skyState.skyGlobalShaderUniforms.skyCloudShadowP[0] = result12
    ? 0.36 *
      skyState.skyDayFactor *
      skyState.smoothSkyRange(skyState.skySunElevationRadians, 0.05, 0.3)
    : 0;
  skyState.skyGlobalShaderUniforms.skyCloudShadowP[1] = 0.53;
  skyState.skyGlobalShaderUniforms.skyCloudShadowP[2] = 0.026;
  skyState.skyGlobalShaderUniforms.skyCloudShadowP[3] = 0.2;
}
