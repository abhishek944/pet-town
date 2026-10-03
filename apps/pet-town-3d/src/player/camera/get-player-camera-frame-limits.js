/** HUD-aware vertical bounds in normalized screen coordinates. */
export function getPlayerCameraFrameLimits(context) {
  const height = context.viewport?.height ?? 720;
  return {
    top: Math.max(0.25, 1 - 190 / height),
    bottom: Math.min(-0.25, -1 + 220 / height),
  };
}
