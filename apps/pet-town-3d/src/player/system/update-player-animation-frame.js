/** Player spawn, context API, fixed-step orchestration, effects, render interpolation and demo controls. */
import { playerState } from "../state.js";
import { interpolatePlayerRenderTransform } from "./interpolate-player-render-transform.js";
import { wrapPlayerFacingAngle } from "./wrap-player-facing-angle.js";
import { emitPlayerWaterEffect } from "./emit-player-water-effect.js";
import { emitPlayerParticles } from "./emit-player-particles.js";
import { dispatchPlayerEvent } from "./dispatch-player-event.js";
import { findPlayerCreatureLookTarget } from "./find-player-creature-look-target.js";
export function updatePlayerAnimationFrame(
  body,
  deltaTime,
  api,
  context,
  renderPosition,
  character,
  moving,
) {
  let demoAnimation = playerState.playerRuntime.anim;
  let speed = Math.hypot(body.vel.x, body.vel.z);
  let runAmount;
  let onGround = body.onGround;
  let verticalSpeed = body.vel.y;
  let swimming = body.swimming || playerState.playerRuntime.forcedSwim;
  let gliding = body.gliding;
  if (demoAnimation === `walk`) {
    speed = playerState.playerMovementSettings.walk;
    onGround = true;
  }
  if (demoAnimation === `run`) {
    speed = playerState.playerMovementSettings.run;
    onGround = true;
  }
  if (demoAnimation === `glide`) {
    gliding = true;
    onGround = false;
    verticalSpeed = -playerState.playerMovementSettings.glideFall;
    speed = 3;
  }
  if (demoAnimation === `fall`) {
    onGround = false;
    verticalSpeed = -9;
  }
  if (demoAnimation === `swim`) {
    swimming = true;
    speed = Math.max(speed, 2.4);
  }
  runAmount = onGround
    ? Math.max(
        0,
        Math.min(
          1,
          (speed - playerState.playerMovementSettings.walk) /
            (playerState.playerMovementSettings.run - playerState.playerMovementSettings.walk),
        ),
      )
    : playerState.playerRuntime.runAmt;
  playerState.playerRuntime.runAmt +=
    (runAmount - playerState.playerRuntime.runAmt) * (1 - Math.exp(-6 * deltaTime));
  let lookTarget =
    api.lookTarget ??
    (demoAnimation
      ? null
      : findPlayerCreatureLookTarget(context, renderPosition, playerState.playerRuntime.facing));
  let animationEvents = character.update(deltaTime, {
    speed: speed,
    runAmt: playerState.playerRuntime.runAmt,
    onGround: onGround,
    vy: verticalSpeed,
    swimming: swimming,
    gliding: gliding,
    facing: playerState.playerRuntime.facing,
    pos: renderPosition,
    look: lookTarget,
    camPos: context.camera.position,
    turnAhead: moving
      ? wrapPlayerFacingAngle(
          playerState.playerRuntime.targetFacing - playerState.playerRuntime.facing,
        )
      : 0,
  });
  if (!isFinite(character.hips.position.y) || !isFinite(character.root.position.y)) {
    character.reset();
  }
  interpolatePlayerRenderTransform(
    playerState.playerRuntime.acc / playerState.playerPhysicsTimeStep,
  );
  for (let result7 of animationEvents) {
    if (result7.type === `step`) {
      let result8 = result7.side ? 1 : -1;
      let copy3 = renderPosition.clone();
      copy3.x += Math.cos(playerState.playerRuntime.facing) * 0.12 * result8;
      copy3.y += 0.02;
      copy3.z -= Math.sin(playerState.playerRuntime.facing) * 0.12 * result8;
      if (body.waterDepth > 0.15) {
        emitPlayerWaterEffect(`ripple`, copy3.setY(body.waterY), 0.45);
      } else {
        if (result7.run) {
          emitPlayerParticles(`dust`, copy3, {
            count: 3,
            scale: 0.55,
          });
        }
      }
      dispatchPlayerEvent(`step`, {
        run: result7.run,
        side: result8,
        pos: copy3,
      });
    } else {
      if (result7.type === `paddle`) {
        emitPlayerWaterEffect(`ripple`, renderPosition.clone().setY(body.waterY), 0.6);
        dispatchPlayerEvent(`paddle`, result7);
      }
    }
  }
  return {
    swimming,
  };
}
