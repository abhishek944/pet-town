/** Player spawn, context API, fixed-step orchestration, effects, render interpolation and demo controls. */
import { playerState } from "../state.js";
export function updatePlayerIntro(world, deltaTime, camera, input) {
  if ((world.refresh(deltaTime), playerState.playerRuntime.firstFrame)) {
    playerState.playerRuntime.firstFrame = false;
    if (playerState.playerRuntime.introMode === `auto`) {
      if (typeof document < `u` && document.querySelector(`.pk-splash`)) {
        camera.holdIntro();
        playerState.playerRuntime.introWatch = true;
      } else {
        camera.startIntro();
      }
    }
  } else if (playerState.playerRuntime.introWatch && !camera.introStarted) {
    let element = document.querySelector(`.pk-splash`);
    if (
      !element ||
      element.classList.contains(`out`) ||
      input.any([`KeyW`, `KeyA`, `KeyS`, `KeyD`, `ArrowUp`, `ArrowDown`, `ArrowLeft`, `ArrowRight`])
    ) {
      playerState.playerRuntime.introWatch = false;
      camera.startIntro();
    }
  }
}
