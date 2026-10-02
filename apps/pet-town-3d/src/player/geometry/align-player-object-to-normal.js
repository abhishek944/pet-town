/** Procedural ellipsoids, iris highlights, tubes, straps, decals, stitched patches and surface projection. */
import { playerState } from "../state.js";
export function alignPlayerObjectToNormal(quaternionValue, value) {
  quaternionValue.quaternion.setFromUnitVectors(playerState.playerForwardAxis, value);
  return quaternionValue;
}
