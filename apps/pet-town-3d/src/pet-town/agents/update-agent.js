import { playerState } from "../../player/state.js";
import { gatherAgentColliders } from "./walkability.js";
import { movementInput } from "./roaming.js";
import { consumePhysicsEvents } from "./events.js";
import { updateAgentPresentation } from "./presentation.js";

export function updateAgent(record, context, dt, records) {
  record.world.refresh(dt);
  gatherAgentColliders(record, records);
  const input = movementInput(record, dt);
  if (record.controlled && record.input.jumpPressed) {
    record.body.jumpBuf = playerState.playerMovementSettings.buffer;
    record.input.jumpPressed = false;
  }
  const step = playerState.playerPhysicsTimeStep;
  record._motion.accumulator = Math.min(record._motion.accumulator + dt, step * 12);
  while (record._motion.accumulator >= step) {
    record.body.step(step, input);
    record._motion.accumulator -= step;
  }
  consumePhysicsEvents(record);
  updateAgentPresentation(record, context, dt, input, step);
}
