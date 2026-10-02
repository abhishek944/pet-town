export function playerCameraLos(yaw, pitch, distance) {
  let focus2 = this.focus;
  let world2 = this.world;
  let result = Math.cos(pitch);
  let result2 = Math.sin(yaw) * result;
  let result3 = Math.sin(pitch);
  let result4 = Math.cos(yaw) * result;
  return Math.min(
    world2.raycast(focus2.x, focus2.y, focus2.z, result2, result3, result4, distance, true),
    world2.raycastColliders(focus2.x, focus2.y, focus2.z, result2, result3, result4, distance),
  );
}
