/** Water lifecycle, terrain rebaking, dynamic reflections/refraction, ripples, splashes, and public water API. */

import { waterState } from "../state.js";
import { getWaterInteractorPosition } from "./get-water-interactor-position.js";
export function updateWaterInteractors(frame) {
  frame.player = frame.context.player;
  if (
    frame.player &&
    typeof frame.player.on == `function` &&
    waterState.waterRuntimeState.hookedPlayer !== frame.player
  ) {
    waterState.waterRuntimeState.hookedPlayer = frame.player;
    let callback3 = () => getWaterInteractorPosition(frame.player);
    try {
      frame.player.on(`splash`, (speedValue) => {
        let callback3Result = callback3();
        if (callback3Result) {
          waterState.waterRuntimeState.splash(
            callback3Result,
            Math.min(2, 0.5 + (speedValue?.speed ?? 4) * 0.1),
            {
              droplets: !frame.context.fx?.burst,
            },
          );
        }
      });
      frame.player.on(`paddle`, () => {
        let callback3Result2 = callback3();
        if (callback3Result2) {
          waterState.waterRuntimeState.ripple(callback3Result2.x, callback3Result2.z, 0.55);
        }
      });
    } catch {
      waterState.waterRuntimeState.hookedPlayer = null;
    }
  }
  frame.interactors = [];
  if (frame.context.player) {
    frame.interactors.push(frame.context.player);
  }
  if (Array.isArray(frame.context.creatures)) {
    frame.interactors.push(...frame.context.creatures);
  } else {
    if (Array.isArray(frame.context.creatures?.list)) {
      frame.interactors.push(...frame.context.creatures.list);
    }
  }
  for (let result8 of frame.interactors) {
    let waterInteractorPositionResult = getWaterInteractorPosition(result8);
    if (!waterInteractorPositionResult || typeof result8 != `object`) {
      continue;
    }
    let position3 = waterState.waterRuntimeState.tracked.get(result8);
    if (!position3) {
      position3 = {
        was: false,
        last: 0,
        x: waterInteractorPositionResult.x,
        y: waterInteractorPositionResult.y,
        z: waterInteractorPositionResult.z,
      };
      waterState.waterRuntimeState.tracked.set(result8, position3);
    }
    let isWaterResult = waterState.waterRuntimeState.isWater(
      waterInteractorPositionResult.x,
      waterInteractorPositionResult.z,
    );
    let Result = waterState.waterRuntimeState.sample(
      waterInteractorPositionResult.x,
      waterInteractorPositionResult.z,
    );
    let result9 =
      isWaterResult &&
      waterInteractorPositionResult.y < Result + 0.25 &&
      waterInteractorPositionResult.y > Result - 2.5;
    let result10 =
      frame.deltaTime > 0 ? (waterInteractorPositionResult.y - position3.y) / frame.deltaTime : 0;
    let result11 =
      frame.deltaTime > 0
        ? Math.hypot(
            waterInteractorPositionResult.x - position3.x,
            waterInteractorPositionResult.z - position3.z,
          ) / frame.deltaTime
        : 0;
    if (result9 && !position3.was) {
      if (!(result8 === waterState.waterRuntimeState.hookedPlayer)) {
        if (result10 < -3) {
          waterState.waterRuntimeState.splash(
            waterInteractorPositionResult,
            Math.min(2, 0.5 + -result10 * 0.12),
          );
        } else {
          waterState.waterRuntimeState.ripple(
            waterInteractorPositionResult.x,
            waterInteractorPositionResult.z,
            0.9,
          );
        }
      }
      position3.last = frame.time;
    } else if (result9) {
      let result12 = result11 > 0.4 ? Math.max(0.16, 0.45 - result11 * 0.04) : 1.6;
      if (frame.time - position3.last > result12) {
        waterState.waterRuntimeState.ripple(
          waterInteractorPositionResult.x,
          waterInteractorPositionResult.z,
          result11 > 0.4 ? Math.min(0.9, 0.3 + result11 * 0.08) : 0.3,
        );
        position3.last = frame.time;
      }
    }
    position3.was = result9;
    position3.x = waterInteractorPositionResult.x;
    position3.y = waterInteractorPositionResult.y;
    position3.z = waterInteractorPositionResult.z;
  }
}
