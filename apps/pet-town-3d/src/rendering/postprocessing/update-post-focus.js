/** Postprocessing pipeline configuration, quality tiers, adaptive quality and render targets. */
import * as THREE from "three";
import { renderingState } from "../state.js";
export function updatePostFocus(deltaTime, context) {
  const post = renderingState.postprocessingState;
  const { params: parameters, mats: materials, U: depthUniforms } = post;
  const { camera } = context;
  depthUniforms.cameraNear.value = camera.near;
  depthUniforms.cameraFar.value = camera.far;
  materials.aoMat.uniforms.uProjInv.value.copy(camera.projectionMatrixInverse);
  materials.aoMat.uniforms.uProj11.value = camera.projectionMatrix.elements[5];
  let targetFocusY = 0.5;
  let targetFocusDistance = 26;
  let hasPlayerFocus = false;
  let playerPosition = post.debugCam
    ? null
    : (context.player?.position ?? context.player?.mesh?.position ?? null);
  if (playerPosition) {
    let focusPoint = post.tmpV.copy(playerPosition);
    focusPoint.y += 0.8;
    let playerDistance = camera.position.distanceTo(focusPoint);
    focusPoint.project(camera);
    if (focusPoint.z < 1 && Math.abs(focusPoint.x) < 0.95 && Math.abs(focusPoint.y) < 0.95) {
      targetFocusDistance = Math.max(3, playerDistance);
      targetFocusY = Math.min(0.7, Math.max(0.3, focusPoint.y * 0.5 + 0.5));
      hasPlayerFocus = true;
    }
  }
  if (!hasPlayerFocus) {
    let viewDirection = camera.getWorldDirection((post.tmpV2 ??= new THREE.Vector3()));
    let terrainHit = context.terrain?.raycast?.(camera.position, viewDirection, 160);
    if (terrainHit && Number.isFinite(terrainHit.distance)) {
      targetFocusDistance = Math.max(3, terrainHit.distance);
    } else {
      if (post.debugCam) {
        targetFocusDistance = camera.position.distanceTo(post.debugCam.target);
      }
    }
  }
  if (parameters.focusDist != null) {
    targetFocusDistance = parameters.focusDist;
  }
  let focusBlend = post.focusInit ? 1 - Math.exp(-deltaTime * 5) : 1;
  post.focusInit = true;
  post.focusY += (targetFocusY - post.focusY) * focusBlend;
  post.focusDist += (targetFocusDistance - post.focusDist) * focusBlend;
  if (!Number.isFinite(post.focusY) || !Number.isFinite(post.focusDist)) {
    post.focusY = targetFocusY;
    post.focusDist = targetFocusDistance;
  }
  depthUniforms.uFocusY.value = post.focusY;
  depthUniforms.uFocusDist.value = post.focusDist;
  depthUniforms.uBand.value = parameters.band;
  depthUniforms.uRamp.value = parameters.ramp;
  let cameraDownwardPitch = -camera.getWorldDirection((post.tmpV2 ??= new THREE.Vector3())).y;
  let tiltWeight = THREE.MathUtils.smoothstep(cameraDownwardPitch, 0.12, 0.6);
  depthUniforms.uTopAmt.value = parameters.tiltTop * tiltWeight;
  depthUniforms.uBottomAmt.value = parameters.tiltBottom * tiltWeight;
  depthUniforms.uFarAmt.value = parameters.farAmt;
  depthUniforms.uNearAmt.value = parameters.nearAmt;
  depthUniforms.uAOStrength.value = parameters.aoStrength;
  materials.aoMat.uniforms.uRadius.value = parameters.aoRadius;
  materials.aoMat.uniforms.uIntensity.value = parameters.aoIntensity;
  materials.aoMat.uniforms.uPower.value = parameters.aoPower;
}
