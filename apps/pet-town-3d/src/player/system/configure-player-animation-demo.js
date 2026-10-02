/** Player spawn, context API, fixed-step orchestration, effects, render interpolation and demo controls. */
import { findPlayerSwimDemoLocation } from "./find-player-swim-demo-location.js";
import { playerState } from "../state.js";
export function configurePlayerAnimationDemo(demoGroundValue) {
  let {
    anim: demoGroundValueValue,
    body: demoGroundValueValue2,
    input: demoGroundValueValue3,
    world: demoGroundValueValue4,
  } = demoGroundValue;
  if (!demoGroundValueValue) {
    return;
  }
  demoGroundValueValue3.enabled = false;
  let y2 = demoGroundValueValue2.pos.y;
  if (
    ((demoGroundValueValue === `walk` || demoGroundValueValue === `run`) &&
      ((demoGroundValueValue2.frozen = true), (demoGroundValueValue2.onGround = true)),
    (demoGroundValue.demoGround = demoGroundValueValue2.pos.y),
    demoGroundValueValue === `jump` && (demoGroundValueValue2.frozen = true),
    (demoGroundValueValue === `glide` || demoGroundValueValue === `fall`) &&
      ((demoGroundValueValue2.frozen = true),
      (demoGroundValueValue2.pos.y = y2 + 1.7),
      demoGroundValueValue2.prev.copy(demoGroundValueValue2.pos)),
    demoGroundValueValue === `swim`)
  ) {
    let result =
      demoGroundValue.ctx.params?.get(`cam`) == null
        ? findPlayerSwimDemoLocation(
            demoGroundValueValue4,
            demoGroundValueValue2.pos.x,
            demoGroundValueValue2.pos.z,
          )
        : null;
    if (result) {
      demoGroundValueValue2.teleport(
        result[0],
        demoGroundValueValue4.waterLevel - playerState.playerMovementSettings.swimFloat,
        result[1],
      );
    } else {
      demoGroundValue.forcedSwim = true;
      demoGroundValueValue2.frozen = true;
    }
  }
}
