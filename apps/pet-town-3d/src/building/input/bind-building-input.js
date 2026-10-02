import { isGameInputCaptured } from "../../core/input-capture.js";
import { bindTouchBuildingInput } from "./bind-touch-building-input.js";
/** Input guards, cursor art and desktop/touch building event bindings. */
import { buildingState } from "../state.js";
import { isBuildingPointerLocked } from "./is-building-pointer-locked.js";
import { isBuildingInputBlocked } from "./is-building-input-blocked.js";
import { handleBuildingMouseButton } from "./handle-building-mouse-button.js";
import { selectBuildingBlock } from "../commands/select-building-block.js";
import { redoBuildingEdit } from "../commands/redo-building-edit.js";
import { undoBuildingEdit } from "../commands/undo-building-edit.js";
export function bindBuildingInput() {
  let canvas =
    buildingState.buildingContext.canvas ?? buildingState.buildingContext.renderer.domElement;
  buildingState.buildingRuntime.cv = canvas;
  addEventListener(`contextmenu`, (event) => {
    if (event.target === canvas) {
      event.preventDefault();
    }
  });
  document.addEventListener(`pointerlockchange`, () => {
    buildingState.buildingPointerLockChangedAt = performance.now();
    if (isBuildingPointerLocked()) {
      buildingState.buildingRuntime.mode = `front`;
    }
  });
  canvas.addEventListener(`mousemove`, (event) => {
    if (isBuildingPointerLocked()) {
      return;
    }
    let bounds = canvas.getBoundingClientRect();
    buildingState.buildingRuntime.mouseNDC.set(
      ((event.clientX - bounds.left) / bounds.width) * 2 - 1,
      -((event.clientY - bounds.top) / bounds.height) * 2 + 1,
    );
    buildingState.buildingRuntime.mouseSeen = true;
    buildingState.buildingRuntime.mode = `cursor`;
  });
  canvas.addEventListener(`mouseleave`, () => {
    if (!isBuildingPointerLocked()) {
      buildingState.buildingRuntime.mode = `front`;
    }
  });
  document.addEventListener("focusin", (event) => {
    if (event.target?.closest?.('[data-town-ui="terminal"]')) {
      buildingState.buildingMousePress = null;
    }
  });
  bindTouchBuildingInput(canvas);
  canvas.addEventListener(`mousedown`, (event) => {
    if (performance.now() - (buildingState.buildingRuntime.lastTouchAt ?? -1e9) < 1200) {
      return;
    }
    if (event.button === 1) {
      event.preventDefault();
    }
    let pointerLocked = isBuildingPointerLocked();
    buildingState.buildingMousePress = {
      b: event.button,
      x: event.clientX,
      y: event.clientY,
      t: performance.now(),
      locked: pointerLocked,
      fired: false,
      next: 0,
    };
    if (pointerLocked) {
      handleBuildingMouseButton(event.button);
      buildingState.buildingMousePress.fired = true;
      buildingState.buildingMousePress.next = performance.now() + 320;
    }
  });
  addEventListener(`mouseup`, (event) => {
    let press = buildingState.buildingMousePress;
    if (
      ((buildingState.buildingMousePress = null), !press || press.fired || press.b !== event.button)
    ) {
      return;
    }
    let pointerTravel = Math.hypot(event.clientX - press.x, event.clientY - press.y);
    let pressDuration = performance.now() - press.t;
    if (!(
      pointerTravel > 4 ||
      pressDuration > 500 ||
      buildingState.buildingPointerLockChangedAt > press.t
    )) {
      handleBuildingMouseButton(press.b);
    }
  });
  let wheelDelta = 0;
  addEventListener(
    `wheel`,
    (event) => {
      let alwaysCycle = buildingState.buildingRuntime.wheelMode === `always`;
      if (
        isBuildingInputBlocked() ||
        isGameInputCaptured(buildingState.buildingContext, event) ||
        event.ctrlKey ||
        !(alwaysCycle || event.shiftKey || event.altKey)
      ) {
        return;
      }
      event.stopPropagation();
      let delta = event.deltaY || event.deltaX;
      wheelDelta += delta;
      let threshold = Math.abs(delta) >= 50 ? 50 : 100;
      for (; Math.abs(wheelDelta) >= threshold;) {
        selectBuildingBlock(buildingState.buildingRuntime.selected + Math.sign(wheelDelta));
        wheelDelta -= Math.sign(wheelDelta) * threshold;
      }
    },
    {
      passive: true,
      capture: true,
    },
  );
  addEventListener(`keydown`, (event) => {
    if (isGameInputCaptured(buildingState.buildingContext, event)) return;
    if (/^(INPUT|TEXTAREA|SELECT)$/.test(event.target?.tagName ?? ``)) {
      return;
    }
    let modifierPressed = event.ctrlKey || event.metaKey;
    if (modifierPressed && event.code === `KeyZ`) {
      event.preventDefault();
      if (!isBuildingInputBlocked()) {
        if (event.shiftKey) {
          redoBuildingEdit();
        } else {
          undoBuildingEdit();
        }
      }
      return;
    }
    if (modifierPressed && event.code === `KeyY`) {
      event.preventDefault();
      if (!isBuildingInputBlocked()) {
        redoBuildingEdit();
      }
      return;
    }
    if (modifierPressed || event.altKey) {
      return;
    }
    let slotIndex = buildingState.buildingHotbarKeyCodes.indexOf(event.code);
    if (
      slotIndex >= 0 &&
      slotIndex < buildingState.resolvedBuildingPalette.length &&
      !isBuildingInputBlocked()
    ) {
      selectBuildingBlock(slotIndex);
    }
  });
}
