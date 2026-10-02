/** Mobile joystick and jump controls that translate pointer gestures into keyboard input. */
import { hudState } from "../state.js";
import { shouldShowTouchControls } from "./should-show-touch-controls.js";
import { releaseAllTouchKeys } from "./release-all-touch-keys.js";
import { setSimulatedTouchKey } from "./set-simulated-touch-key.js";
import { installGameStyles } from "../../core/install-game-styles.js";
export function createTouchControls(context, parent) {
  installGameStyles("pk-touch-css", hudState.touchControlStyles);
  hudState.touchControlsElement = document.createElement(`div`);
  hudState.touchControlsElement.className = `pk-touch`;
  hudState.touchControlsElement.innerHTML = `<div class="pk-stick"><div class="pk-thumb"></div></div><div class="pk-jump" aria-label="Jump">${hudState.touchJumpIconMarkup}</div>`;
  parent.append(hudState.touchControlsElement);
  let element = hudState.touchControlsElement.querySelector(`.pk-stick`);
  let element2 = hudState.touchControlsElement.querySelector(`.pk-thumb`);
  let element3 = hudState.touchControlsElement.querySelector(`.pk-jump`);
  let result = (() => {
    try {
      return matchMedia(hudState.touchControlMediaQuery);
    } catch {
      return null;
    }
  })();
  let callback = () => {
    let shouldShowTouchControlsResult = shouldShowTouchControls();
    hudState.touchControlsElement.classList.toggle(`on`, shouldShowTouchControlsResult);
    document.documentElement.classList.toggle(`pk-coarse`, shouldShowTouchControlsResult);
    if (!shouldShowTouchControlsResult) {
      releaseAllTouchKeys();
    }
  };
  result?.addEventListener?.(`change`, callback);
  callback();
  let result2 = null;
  let index = 0;
  let index2 = 0;
  let result3 = 50;
  let callback2 = (toFixedValue, toFixedValue2) => {
    element2.style.transform = `translate(${toFixedValue.toFixed(1)}px,${toFixedValue2.toFixed(1)}px)`;
  };
  let callback3 = (value2, value3) => {
    let hypotResult = Math.hypot(value2, value3);
    let result5 = hypotResult > result3 ? result3 / hypotResult : 1;
    value2 *= result5;
    value3 *= result5;
    callback2(value2, value3);
    let result6 = value2 / result3;
    let result7 = value3 / result3;
    let result8 = Math.min(1, hypotResult / result3);
    let result9 = result8 < 0.22;
    setSimulatedTouchKey(`KeyD`, !result9 && result6 > 0.38);
    setSimulatedTouchKey(`KeyA`, !result9 && result6 < -0.38);
    setSimulatedTouchKey(`KeyS`, !result9 && result7 > 0.38);
    setSimulatedTouchKey(`KeyW`, !result9 && result7 < -0.38);
    setSimulatedTouchKey(`ShiftLeft`, result8 > 0.94);
    element.classList.toggle(`run`, result8 > 0.94);
  };
  element.addEventListener(`pointerdown`, (event) => {
    if ((event.preventDefault(), event.stopPropagation(), result2 != null)) {
      return;
    }
    result2 = event.pointerId;
    element.setPointerCapture?.(event.pointerId);
    element.classList.add(`active`);
    let boundingClientRectResult = element.getBoundingClientRect();
    index = boundingClientRectResult.left + boundingClientRectResult.width / 2;
    index2 = boundingClientRectResult.top + boundingClientRectResult.height / 2;
    result3 = boundingClientRectResult.width * 0.38;
    callback3(event.clientX - index, event.clientY - index2);
  });
  element.addEventListener(`pointermove`, (event2) => {
    if (event2.pointerId === result2) {
      event2.preventDefault();
      callback3(event2.clientX - index, event2.clientY - index2);
    }
  });
  let callback4 = (pointerIdValue) => {
    if (pointerIdValue.pointerId === result2) {
      result2 = null;
      element.classList.remove(`active`, `run`);
      callback2(0, 0);
      for (let result10 of [`KeyW`, `KeyA`, `KeyS`, `KeyD`, `ShiftLeft`]) {
        setSimulatedTouchKey(result10, false);
      }
    }
  };
  element.addEventListener(`pointerup`, callback4);
  element.addEventListener(`pointercancel`, callback4);
  element.addEventListener(`lostpointercapture`, callback4);
  let result4 = null;
  element3.addEventListener(`pointerdown`, (event3) => {
    event3.preventDefault();
    event3.stopPropagation();
    result4 = event3.pointerId;
    element3.setPointerCapture?.(event3.pointerId);
    element3.classList.add(`down`);
    setSimulatedTouchKey(`Space`, true);
    navigator.vibrate?.(8);
  });
  let callback5 = (pointerIdValue2) => {
    if (pointerIdValue2.pointerId === result4) {
      result4 = null;
      element3.classList.remove(`down`);
      setSimulatedTouchKey(`Space`, false);
    }
  };
  element3.addEventListener(`pointerup`, callback5);
  element3.addEventListener(`pointercancel`, callback5);
  element3.addEventListener(`lostpointercapture`, callback5);
  addEventListener(`blur`, releaseAllTouchKeys);
  document.addEventListener(`visibilitychange`, () => {
    if (document.hidden) {
      releaseAllTouchKeys();
    }
  });
  return {
    get on() {
      return hudState.touchControlsElement.classList.contains(`on`);
    },
    releaseAll: releaseAllTouchKeys,
  };
}
