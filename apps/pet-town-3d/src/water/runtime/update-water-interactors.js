/** Water lifecycle, terrain rebaking, dynamic reflections/refraction, ripples, splashes, and public water API. */

import { waterState } from "../state.js";
import { getWaterInteractorPosition } from "./get-water-interactor-position.js";
export function updateWaterInteractors(frame) {
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
      // Player physics owns entry splashes; only infer entries for creatures.
      if (result8 !== frame.context.player) {
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
    } else if (result9 && result11 > 0.4) {
      let result12 = Math.max(0.16, 0.45 - result11 * 0.04);
      if (frame.time - position3.last > result12) {
        waterState.waterRuntimeState.ripple(
          waterInteractorPositionResult.x,
          waterInteractorPositionResult.z,
          Math.min(0.9, 0.3 + result11 * 0.08),
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
