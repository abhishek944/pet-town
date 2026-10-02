import * as THREE from "three";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { renderingState } from "../state.js";
import { cozyOutputPassClass } from "./cozy-output-pass-class.js";

export function createBloomPass(parameters, depthUniforms) {
  const bloom = new UnrealBloomPass(
    new THREE.Vector2(256, 256),
    parameters.bloomStrength,
    parameters.bloomRadius,
    parameters.bloomThreshold,
  );
  bloom.highPassUniforms.smoothWidth.value = parameters.bloomKnee;
  bloom.highPassUniforms.uTexel = { value: new THREE.Vector2(1, 1) };
  bloom.highPassUniforms.tDepth = depthUniforms.tDepth;
  bloom.materialHighPassFilter.fragmentShader = renderingState.bloomHighPassFragmentShader;
  bloom.materialHighPassFilter.needsUpdate = true;
  bloom.bloomTintColors.forEach((color, index) =>
    color.set(1, 1 - index * 0.025, 1 - index * 0.06),
  );
  const resizeBloom = bloom.setSize.bind(bloom);
  bloom.setSize = (width, height) => {
    bloom.highPassUniforms.uTexel.value.set(1 / width, 1 / height);
    const scale = renderingState.postprocessingState.tier.bloomScale;
    resizeBloom(Math.max(4, Math.round(width * scale)), Math.max(4, Math.round(height * scale)));
  };
  return bloom;
}

export function createColorGradePass(parameters) {
  const output = new cozyOutputPassClass({
    uRes: { value: new THREE.Vector2() },
    uTime: { value: 0 },
    uWB: { value: new THREE.Vector3(1, 1, 1) },
    uLift: { value: new THREE.Vector3() },
    uGamma: { value: new THREE.Vector3(1, 1, 1) },
    uGain: { value: new THREE.Vector3(1, 1, 1) },
    uShadowTint: { value: new THREE.Vector3() },
    uHighTint: { value: new THREE.Vector3() },
    uVigColor: { value: new THREE.Vector3(1, 1, 1) },
    uSat: { value: 1 },
    uVibrance: { value: 0 },
    uContrast: { value: 0 },
    uVignette: { value: 0 },
    uGrain: { value: parameters.grain },
    uGradeAmt: { value: parameters.grade },
    uChromaKnee: { value: parameters.chromaKnee },
    uChromaSlope: { value: parameters.chromaSlope },
    uGreenAmt: { value: 1 },
    uMagentaCut: { value: 0 },
  });
  output.setSize = (width, height) => output.uniforms.uRes.value.set(width, height);
  return output;
}
