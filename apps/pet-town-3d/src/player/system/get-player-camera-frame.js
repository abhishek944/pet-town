/** Player spawn, context API, fixed-step orchestration, effects, render interpolation and demo controls. */
import { playerState } from "../state.js";
import { Vector3 } from "three";
const head = new Vector3();
const root = new Vector3();
export function getPlayerCameraFrame() {
  let body2 = playerState.playerRuntime.body;
  const character = playerState.playerRuntime.char;
  character.head.getWorldPosition(head);
  character.root.getWorldPosition(root);
  head.sub(root).add(playerState.playerRuntime.renderPos);
  return {
    pos: playerState.playerRuntime.renderPos,
    head,
    vel: body2.vel,
    onGround: body2.onGround,
    swimming: body2.swimming || playerState.playerRuntime.forcedSwim,
    diving: body2.diving,
    gliding: body2.gliding,
    lastGroundY: body2.lastGroundY,
    runAmt: playerState.playerRuntime.runAmt,
    stepPhase: playerState.playerRuntime.char.phase,
    moving: playerState.playerRuntime.moveVec.lengthSq() > 0.01,
  };
}
