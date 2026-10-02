/** Player spawn, context API, fixed-step orchestration, effects, render interpolation and demo controls. */
import { playerState } from "../state.js";
export function publishPlayerFrame(api, renderPosition, body, swimming, character) {
  api.position.copy(renderPosition);
  api.onGround = body.onGround;
  api.inWater = body.waterDepth > 0.05 || swimming;
  api.swimming = swimming;
  api.gliding = body.gliding;
  api.facing = playerState.playerRuntime.facing;
  api.waterDepth = body.waterDepth;
  api.forward.set(
    Math.sin(playerState.playerRuntime.facing),
    0,
    Math.cos(playerState.playerRuntime.facing),
  );
  character.head.getWorldPosition(api.head);
}
