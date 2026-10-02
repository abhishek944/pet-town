/** Player spawn, context API, fixed-step orchestration, effects, render interpolation and demo controls. */
import { playerState } from "../state.js";
export function interpolatePlayerRenderTransform(value) {
  let body2 = playerState.playerRuntime.body;
  let renderPos2 = playerState.playerRuntime.renderPos;
  renderPos2.lerpVectors(body2.prev, body2.pos, value);
  renderPos2.y += body2.visualOffsetY;
  let root2 = playerState.playerRuntime.char.root;
  let result = root2.userData.swimLift ?? 0;
  root2.position.set(renderPos2.x, renderPos2.y + result, renderPos2.z);
  root2.rotation.y = playerState.playerRuntime.facing;
}
