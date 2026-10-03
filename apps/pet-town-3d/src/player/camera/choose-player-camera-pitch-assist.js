/** Prefer a small upward correction and hold it briefly across rail corners. */
export function choosePlayerCameraPitchAssist(
  sampleClearDistance,
  desiredDistance,
  deltaTime,
  minimumDistance = 0,
) {
  if (this.manualOrbit) {
    this.assistHoldTime = 0;
    this.assistTarget = 0;
    return 0;
  }
  const unassistedDistance = sampleClearDistance(this.pitch);
  const comfortableDistance = Math.min(
    desiredDistance,
    Math.max(2.6, desiredDistance * 0.8, minimumDistance),
  );
  let targetAssist = 0;
  let bestDistance = unassistedDistance;
  if (unassistedDistance < comfortableDistance) {
    for (let step = 1; step <= 8; step++) {
      const pitch = Math.min(1.42, this.pitch + step * 0.06);
      const distance = sampleClearDistance(pitch);
      if (distance > bestDistance + 0.25) {
        targetAssist = pitch - this.pitch;
        bestDistance = distance;
      }
      if (distance >= comfortableDistance || pitch >= 1.42) break;
    }
  }
  // Under a roof, a small upward improvement must not prevent a much clearer
  // bounded lower path. Prefer clearance rather than repeatedly lifting at it.
  if (bestDistance < comfortableDistance) {
    for (let step = 1; step <= 8; step++) {
      const pitch = Math.max(0.1, this.pitch - step * 0.06);
      if (pitch >= this.pitch) break;
      const distance = sampleClearDistance(pitch);
      if (distance > bestDistance + 0.25) {
        targetAssist = pitch - this.pitch;
        bestDistance = distance;
      }
      if (distance >= comfortableDistance) break;
      if (pitch <= 0.1) break;
    }
  }
  if (targetAssist !== 0) {
    this.assistHoldTime = 0.15;
    this.assistTarget = targetAssist;
  } else if (deltaTime > 0 && this.assistHoldTime > 0) {
    this.assistHoldTime = Math.max(0, this.assistHoldTime - deltaTime);
    if (sampleClearDistance(this.pitch + this.assistTarget) >= unassistedDistance) {
      targetAssist = this.assistTarget;
    }
  }
  return targetAssist;
}
