/** Player spawn, context API, fixed-step orchestration, effects, render interpolation and demo controls. */
import { playerState } from "../state.js";
import { updatePlayerAnimationDemo } from "./update-player-animation-demo.js";
import { interpolatePlayerRenderTransform } from "./interpolate-player-render-transform.js";
import { wrapPlayerFacingAngle } from "./wrap-player-facing-angle.js";
export function updatePlayerControlsAndPhysics(input, deltaTime, camera, body, world) {
  let controls = input.poll(deltaTime);
  updatePlayerAnimationDemo(playerState.playerRuntime, deltaTime, controls);
  camera.input(controls, deltaTime);
  camera.basis(playerState.playerRuntime.fwd, playerState.playerRuntime.right);
  let movement = playerState.playerRuntime.moveVec
    .set(0, 0, 0)
    .addScaledVector(playerState.playerRuntime.fwd, controls.y)
    .addScaledVector(playerState.playerRuntime.right, controls.x);
  if (movement.lengthSq() > 1) {
    movement.normalize();
  }
  let running = controls.run;
  if (controls.jumpPressed) {
    body.jumpBuf = playerState.playerMovementSettings.buffer;
  }
  world.gatherColliders(body.pos.x, body.pos.y, body.pos.z, Math.max(5, camera.curDist + 2));
  playerState.playerRuntime.acc = Math.min(
    playerState.playerRuntime.acc + deltaTime,
    playerState.playerPhysicsTimeStep * playerState.playerMaxPhysicsSteps,
  );
  let physicsInput = {
    mx: movement.x,
    mz: movement.z,
    run: running,
    jumpHeld: controls.jumpHeld,
  };
  for (; playerState.playerRuntime.acc >= playerState.playerPhysicsTimeStep;) {
    body.step(playerState.playerPhysicsTimeStep, physicsInput);
    playerState.playerRuntime.acc -= playerState.playerPhysicsTimeStep;
  }
  interpolatePlayerRenderTransform(
    playerState.playerRuntime.acc / playerState.playerPhysicsTimeStep,
  );
  let moving = movement.lengthSq() > 0.0025;
  if (moving) {
    playerState.playerRuntime.targetFacing = Math.atan2(movement.x, movement.z);
  }
  let turnSpeed = body.swimming ? 7 : body.gliding ? 6 : body.onGround ? 16 : 9;
  playerState.playerRuntime.facing +=
    wrapPlayerFacingAngle(
      playerState.playerRuntime.targetFacing - playerState.playerRuntime.facing,
    ) *
    (1 - Math.exp(-turnSpeed * deltaTime));
  playerState.playerRuntime.facing = wrapPlayerFacingAngle(playerState.playerRuntime.facing);
  let renderPosition = playerState.playerRuntime.renderPos;
  return {
    moving,
    renderPosition,
  };
}
