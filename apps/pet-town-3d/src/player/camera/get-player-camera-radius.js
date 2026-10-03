/** Enclose the actual near plane, including its distance from the eye. */
export function getPlayerCameraRadius(camera) {
  const halfHeight = camera.near * Math.tan((camera.fov * Math.PI) / 360);
  return Math.max(0.18, Math.hypot(camera.near, halfHeight, halfHeight * camera.aspect) + 0.04);
}
