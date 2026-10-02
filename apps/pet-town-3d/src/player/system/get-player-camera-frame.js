/** Player spawn, context API, fixed-step orchestration, effects, render interpolation and demo controls. */
import { playerState } from "../state.js";
export function getPlayerCameraFrame() {
  let body2 = playerState.playerRuntime.body;
  return {
    pos: playerState.playerRuntime.renderPos,
    vel: body2.vel,
    onGround: body2.onGround,
    swimming: body2.swimming || playerState.playerRuntime.forcedSwim,
    gliding: body2.gliding,
    lastGroundY: body2.lastGroundY,
    runAmt: playerState.playerRuntime.runAmt,
    stepPhase: playerState.playerRuntime.char.phase,
    moving: playerState.playerRuntime.moveVec.lengthSq() > 0.01,
  };
}
