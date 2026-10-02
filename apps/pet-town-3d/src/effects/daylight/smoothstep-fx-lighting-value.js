/** Sun elevation and day, golden-hour and night weights for effects. */
export let smoothstepFxLightingValue = (start, end, value) => {
  let result = Math.min(1, Math.max(0, (value - start) / (end - start)));
  return result * result * (3 - 2 * result);
};
