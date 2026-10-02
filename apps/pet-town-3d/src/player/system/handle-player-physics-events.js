/** Player spawn, context API, fixed-step orchestration, effects, render interpolation and demo controls. */
import { playerState } from "../state.js";
import { emitPlayerWaterEffect } from "./emit-player-water-effect.js";
import { emitPlayerParticles } from "./emit-player-particles.js";
import { dispatchPlayerEvent } from "./dispatch-player-event.js";
import { getPlayerCameraFrame } from "./get-player-camera-frame.js";
export function handlePlayerPhysicsEvents(body, character, renderPosition, camera) {
  for (let result5 of body.events) {
    if (result5.type === `jump`) {
      character.onJump();
      if (result5.fromWater) {
        emitPlayerWaterEffect(
          `splash`,
          renderPosition.clone().setY(body.waterY > -1 / 0 ? body.waterY : renderPosition.y),
          0.8,
        );
      } else {
        emitPlayerParticles(`dust`, renderPosition, {
          count: 6,
          scale: 0.8,
        });
      }
      dispatchPlayerEvent(`jump`, result5);
    } else if (result5.type === `land`) {
      character.onLand(result5.impact);
      if (result5.impact > 5 && body.waterDepth < 0.2) {
        emitPlayerParticles(`dust`, renderPosition, {
          count: Math.round(5 + result5.impact * 0.6),
          scale: 0.7 + Math.min(0.8, result5.impact * 0.03),
        });
      }
      if (result5.impact > 13) {
        camera.kick(result5.impact);
      }
      dispatchPlayerEvent(`land`, result5);
    } else if (result5.type === `splash`) {
      let copy2 = renderPosition.clone();
      copy2.y = isFinite(result5.y) ? result5.y : copy2.y;
      emitPlayerWaterEffect(`splash`, copy2, Math.min(2, 0.5 + result5.speed / 10));
      dispatchPlayerEvent(`splash`, result5);
    } else if (result5.type === `glide`) {
      character.onGlide();
      emitPlayerParticles(`leaves`, renderPosition.clone().setY(renderPosition.y + 2.1), {
        count: 4,
        scale: 0.8,
      });
      dispatchPlayerEvent(`glide`, result5);
    } else if (result5.type === `stepUp`) {
      character.onStepUp();
    } else if (result5.type === `bonk`) {
      character.onBonk();
      for (let result6 of playerState.playerRuntime.events.get(`bonk`) ?? []) {
        try {
          result6(result5);
        } catch {}
      }
    } else {
      if (result5.type === `respawn`) {
        playerState.playerRuntime.renderPos.copy(body.pos);
        if (!camera.frozen) {
          camera.snap(getPlayerCameraFrame());
        }
        dispatchPlayerEvent(`respawn`, result5);
      }
    }
  }
  body.events.length = 0;
}
