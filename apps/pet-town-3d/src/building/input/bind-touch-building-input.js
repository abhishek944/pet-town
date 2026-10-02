/** Input guards, cursor art and desktop/touch building event bindings. */
import { buildingState } from "../state.js";
import { updateBuildingTarget } from "../targeting/update-building-target.js";
import { isBuildingInputBlocked } from "./is-building-input-blocked.js";
import { wakeBuildingInteraction } from "../state/wake-building-interaction.js";
import { breakTargetBlock } from "../commands/break-target-block.js";
import { placeSelectedBlock } from "../commands/place-selected-block.js";
export function bindTouchBuildingInput(canvas) {
  let activeTouch = null;
  document.addEventListener("focusin", (event) => {
    if (event.target?.closest?.('[data-town-ui="terminal"]') && activeTouch) {
      clearTimeout(activeTouch.timer);
      activeTouch = null;
    }
  });
  let aimAtTouch = (clientX, clientY) => {
    let bounds = canvas.getBoundingClientRect();
    buildingState.buildingRuntime.mouseNDC.set(
      ((clientX - bounds.left) / bounds.width) * 2 - 1,
      -((clientY - bounds.top) / bounds.height) * 2 + 1,
    );
    buildingState.buildingRuntime.mouseSeen = true;
    buildingState.buildingRuntime.mode = `cursor`;
    updateBuildingTarget();
  };
  let recentlyPettedCreature = () =>
    buildingState.buildingContext.lastCreatureClick &&
    (buildingState.buildingContext.time ?? 0) -
      buildingState.buildingContext.lastCreatureClick.time <
      0.5;
  canvas.addEventListener(`pointerdown`, (event) => {
    if (event.pointerType !== `touch`) {
      return;
    }
    if (((buildingState.buildingRuntime.lastTouchAt = performance.now()), activeTouch)) {
      clearTimeout(activeTouch.timer);
      activeTouch.cancel = true;
      return;
    }
    let touch = (activeTouch = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      t: performance.now(),
    });
    touch.timer = setTimeout(() => {
      if (!(
        activeTouch !== touch ||
        touch.moved ||
        touch.cancel ||
        isBuildingInputBlocked() ||
        recentlyPettedCreature()
      )) {
        touch.done = true;
        aimAtTouch(touch.x, touch.y);
        wakeBuildingInteraction();
        if (breakTargetBlock()) {
          navigator.vibrate?.(15);
        }
      }
    }, 460);
  });
  addEventListener(`pointermove`, (event) => {
    let touch = activeTouch;
    if (
      touch &&
      event.pointerId === touch.id &&
      Math.hypot(event.clientX - touch.x, event.clientY - touch.y) > 12
    ) {
      touch.moved = true;
      clearTimeout(touch.timer);
    }
  });
  let finishTouch = (event) => {
    let touch = activeTouch;
    if (touch && event.pointerId === touch.id) {
      activeTouch = null;
      clearTimeout(touch.timer);
      buildingState.buildingRuntime.lastTouchAt = performance.now();
      if (!(
        event.type === `pointercancel` ||
        touch.moved ||
        touch.done ||
        touch.cancel ||
        performance.now() - touch.t > 420 ||
        isBuildingInputBlocked() ||
        recentlyPettedCreature()
      )) {
        aimAtTouch(touch.x, touch.y);
        wakeBuildingInteraction();
        placeSelectedBlock();
      }
    }
  };
  addEventListener(`pointerup`, finishTouch);
  addEventListener(`pointercancel`, finishTouch);
}
