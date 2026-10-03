import { Vector3 } from "three";
import { getPlayerCameraRadius } from "./get-player-camera-radius.js";
export function playerCameraLos(yaw, pitch, distance) {
  let focus2 = this.focus;
  let result = Math.cos(pitch);
  let result2 = Math.sin(yaw) * result;
  let result3 = Math.sin(pitch);
  let result4 = Math.cos(yaw) * result;
  const queries = this.ctx.cameraQueries;
  queries.prepare(focus2, distance, this.safePosition);
  const endpoint = new Vector3(
    focus2.x + result2 * distance,
    focus2.y + result3 * distance,
    focus2.z + result4 * distance,
  );
  const hit = queries.sweep(focus2, endpoint, getPlayerCameraRadius(this.cam));
  return hit ? hit.distance : distance;
}
