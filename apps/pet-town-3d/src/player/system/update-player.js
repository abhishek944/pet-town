import { updatePlayerIntro } from "./update-player-intro.js";
import { updatePlayerControlsAndPhysics } from "./update-player-controls-and-physics.js";
import { handlePlayerPhysicsEvents } from "./handle-player-physics-events.js";
import { updatePlayerAnimationFrame } from "./update-player-animation-frame.js";
import { updatePlayerPresentation } from "./update-player-presentation.js";
import { publishPlayerFrame } from "./publish-player-frame.js";
/** Player spawn, context API, fixed-step orchestration, effects, render interpolation and demo controls. */
import { playerState } from "../state.js";
export function updatePlayer(deltaTime, context) {
  if (!playerState.playerRuntime) {
    return;
  }
  deltaTime = deltaTime > 0 && isFinite(deltaTime) ? Math.min(deltaTime, 0.1) : 0;
  let {
    body: body,
    char: character,
    input: input,
    cam: camera,
    world: world,
    api: api,
  } = playerState.playerRuntime;
  updatePlayerIntro.call(this, world, deltaTime, camera, input);
  let moving, renderPosition;
  ({ moving, renderPosition } = updatePlayerControlsAndPhysics.call(
    this,
    input,
    deltaTime,
    camera,
    body,
    world,
  ));
  handlePlayerPhysicsEvents.call(this, body, character, renderPosition, camera);
  let swimming;
  ({ swimming } = updatePlayerAnimationFrame.call(
    this,
    body,
    deltaTime,
    api,
    context,
    renderPosition,
    character,
    moving,
  ));
  updatePlayerPresentation.call(
    this,
    context,
    character,
    world,
    renderPosition,
    swimming,
    body,
    camera,
    deltaTime,
  );
  publishPlayerFrame.call(this, api, renderPosition, body, swimming, character);
}
