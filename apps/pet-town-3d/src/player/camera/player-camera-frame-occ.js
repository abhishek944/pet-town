export function playerCameraFrameOcc(yaw, pitch, distance) {
  let focus2 = this.focus;
  let world2 = this.world;
  let result = Math.cos(pitch);
  let cam2 = this.cam;
  let result2 = focus2.x + Math.sin(yaw) * result * distance;
  let result3 = focus2.y + Math.sin(pitch) * distance;
  let result4 = focus2.z + Math.cos(yaw) * result * distance;
  let atanResult = Math.atan(Math.tan((cam2.fov * Math.PI) / 180 / 2) * (cam2.aspect || 1.6));
  let options = {
    l: 0,
    r: 0,
  };
  let result5 = (cam2.fov * Math.PI) / 180 / 2;
  let result6 = [
    Math.max(0.05, pitch - result5 * 0.6),
    pitch,
    pitch + result5 * 0.5,
    pitch + result5 * 0.95,
  ].map((value4) => Math.tan(Math.min(1.35, value4)));
  for (let result7 of [0.35, 0.55, 0.75, 0.95]) {
    for (let result8 of [1, -1]) {
      for (let result9 of result6) {
        let result10 = yaw + Math.PI + result8 * atanResult * result7;
        let result11 = Math.sin(result10);
        let result12 = Math.cos(result10);
        let hypotResult = Math.hypot(result11, result9, result12);
        let result13 = result11 / hypotResult;
        let result14 = -result9 / hypotResult;
        let result15 = result12 / hypotResult;
        let raycastResult = world2.raycast(
          result2,
          result3,
          result4,
          result13,
          result14,
          result15,
          14,
          true,
        );
        let raycastCollidersResult = world2.raycastColliders(
          result2,
          result3,
          result4,
          result13,
          result14,
          result15,
          14,
        );
        let raycastCollidersResultValue = raycastCollidersResult;
        if (raycastResult < raycastCollidersResult) {
          let result16 = result2 + result13 * raycastResult;
          let result17 = result3 + result14 * raycastResult;
          let result18 = result4 + result15 * raycastResult;
          raycastCollidersResultValue =
            result17 - world2.groundBelow(result16, result17 + 0.6, result18, 3, true) < 0.55
              ? 14
              : raycastResult;
        }
        if (raycastCollidersResultValue < 14) {
          options[result8 > 0 ? `l` : `r`] +=
            (0.6 + (0.4 * (14 - raycastCollidersResultValue)) / 14) * 0.25;
        }
      }
    }
  }
  return options;
}
