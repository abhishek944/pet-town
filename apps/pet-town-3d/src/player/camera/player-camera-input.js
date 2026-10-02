import { clampPlayerCameraValue } from "./clamp-player-camera-value.js";
export function playerCameraInput(input, deltaTime) {
  let result = 0.0052;
  let result2 = input.orbitX || input.orbitY || input.rotate || input.zoom;
  this.yawT -= input.orbitX * result;
  this.pitchT = clampPlayerCameraValue(this.pitchT + input.orbitY * result * 0.85, -0.25, 1.32);
  this.yawT += input.rotate * 2.3 * deltaTime;
  if (input.zoom) {
    this.distT = clampPlayerCameraValue(
      this.distT * Math.exp(input.zoom * 0.0011),
      this.minDist,
      this.maxDist,
    );
  }
  this.idleInput = result2 ? 0 : this.idleInput + deltaTime;
}
