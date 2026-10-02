/** Cached primitive meshes, rig groups, glider leaf and blob-shadow texture generation. */
import { playerState } from "../state.js";
export function preparePlayerRigBuilders() {
  playerState.playerGeometryCache = {};
}
