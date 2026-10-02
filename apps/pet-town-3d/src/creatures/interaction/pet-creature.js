/** Ray picking, petting reactions and pointer interaction. */
import { creaturesState } from "../state.js";
export function petCreature(stateValue, externalValue = {}) {
  if (!stateValue) {
    return;
  }
  let ctx2 = creaturesState.creaturesRuntime.ctx;
  let result = stateValue.state === `sleep`;
  stateValue.affection++;
  stateValue.happyT = 1.6;
  stateValue.idleHop = 2;
  stateValue.sq.kick(-5);
  if (!stateValue.pose) {
    stateValue.setState(`happy`, result ? 2.2 : 1.7);
  }
  stateValue.emote(`heart`, 1.8, true);
  let copy = stateValue.headWorld.clone();
  if (
    ((copy.y += 0.1),
    creaturesState.creaturesRuntime.icons.emit(copy, `heart`, 7),
    stateValue.rare && creaturesState.creaturesRuntime.icons.emit(copy, `sparkle`, 4),
    !externalValue.external)
  ) {
    try {
      ctx2.fx?.burst?.(copy.clone(), `hearts`);
    } catch {}
    try {
      ctx2.audio?.play?.(`pet`, copy);
    } catch {}
  }
  try {
    window.dispatchEvent(
      new CustomEvent(`creature:pet`, {
        detail: {
          creature: stateValue,
        },
      }),
    );
  } catch {}
  for (let result2 of stateValue.parts.jiggles) {
    result2.impulse.set((Math.random() - 0.5) * 2, 2.5, (Math.random() - 0.5) * 2);
  }
}
