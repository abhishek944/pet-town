import { playerState } from "../../player/state.js";
import { samplePlayerNightFactor } from "../../player/materials/sample-player-night-factor.js";
import { emitControlledAnimationEvents } from "./events.js";

export function updateAgentPresentation(record, context, dt, input, step) {
  const { body, character, position, world } = record;
  position.lerpVectors(body.prev, body.pos, record._motion.accumulator / step);
  position.y += body.visualOffsetY;
  const speed = Math.hypot(body.vel.x, body.vel.z);
  const faceConversation = record.isMayor && record.conversationActive && !record.controlled;
  let targetFacing = record.facing;
  if (Math.hypot(input.mx, input.mz) > 0.03) targetFacing = Math.atan2(input.mx, input.mz);
  else if (faceConversation) {
    targetFacing = Math.atan2(
      context.camera.position.x - position.x,
      context.camera.position.z - position.z,
    );
  }
  const turn = Math.atan2(
    Math.sin(targetFacing - record.facing),
    Math.cos(targetFacing - record.facing),
  );
  record.facing += turn * (1 - Math.exp(-12 * dt));
  const settings = playerState.playerMovementSettings;
  const runTarget = body.onGround
    ? Math.max(0, Math.min(1, (speed - settings.walk) / (settings.run - settings.walk)))
    : record.runAmt;
  record.runAmt += (runTarget - record.runAmt) * (1 - Math.exp(-6 * dt));
  const events = character.update(dt, {
    speed,
    runAmt: record.runAmt,
    onGround: body.onGround,
    vy: body.vel.y,
    swimming: body.swimming,
    gliding: body.gliding,
    facing: record.facing,
    pos: position,
    look: faceConversation ? context.camera.position : null,
    camPos: context.camera.position,
    turnAhead: turn,
  });
  character.root.position.copy(position);
  character.root.position.y += character.root.userData.swimLift || 0;
  character.root.rotation.y = record.facing;
  character.M.blush.opacity = 0.95 - 0.5 * samplePlayerNightFactor(context);
  if (record.status === "speaking") {
    character.smile.visible = false;
    character.mouthO.visible = true;
    character.mouthO.scale.y = 0.55 + Math.abs(Math.sin(body.time * 11)) * 0.3;
  }
  character.root.updateMatrixWorld(true);
  character.head.getWorldPosition(record.head);
  let groundY = world.groundBelow(position.x, position.y + 0.3, position.z, 24);
  let onWater = false;
  if (
    Number.isFinite(world.waterLevel) &&
    world.waterLevel > groundY &&
    world.waterLevel <= position.y + 0.9
  ) {
    groundY = world.waterLevel;
    onWater = true;
  }
  if (body.swimming && Number.isFinite(body.waterY)) {
    groundY = body.waterY;
    onWater = true;
  }
  character.placeShadow(position.x, groundY, position.z, position.y, onWater);
  if (body.diving && body.waterDepth > 1.1) character.shadow.visible = false;
  emitControlledAnimationEvents(record, events);
}
