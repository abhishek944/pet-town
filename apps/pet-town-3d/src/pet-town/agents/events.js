import { dispatchPlayerEvent } from "../../player/system/dispatch-player-event.js";
import { emitPlayerParticles } from "../../player/system/emit-player-particles.js";
import { emitPlayerWaterEffect } from "../../player/system/emit-player-water-effect.js";

export function consumePhysicsEvents(record) {
  const { body, character } = record;
  for (const event of body.events) {
    if (event.type === "jump") character.onJump();
    else if (event.type === "land") character.onLand(event.impact);
    else if (event.type === "glide") character.onGlide();
    else if (event.type === "stepUp") character.onStepUp();
    else if (event.type === "bonk") character.onBonk();
    else if (event.type === "respawn") record.position.copy(body.pos);
    if (!record.controlled) continue;
    const position = body.pos.clone();
    if (event.type === "jump" && !event.fromWater) {
      emitPlayerParticles("dust", position, { count: 6, scale: 0.8 });
    } else if (event.type === "land" && event.impact > 5 && body.waterDepth < 0.2) {
      emitPlayerParticles("dust", position, {
        count: Math.round(5 + event.impact * 0.6),
        scale: 0.8,
      });
    } else if (event.type === "splash" || (event.type === "jump" && event.fromWater)) {
      emitPlayerWaterEffect("splash", position.setY(body.waterY), 0.8);
    } else if (event.type === "glide") {
      emitPlayerParticles("leaves", position.setY(position.y + 2.1), { count: 4, scale: 0.8 });
    }
    if (event.type !== "stepUp")
      dispatchPlayerEvent(event.type, { ...event, pos: body.pos.clone(), agentId: record.id });
  }
  body.events.length = 0;
}

export function emitControlledAnimationEvents(record, events) {
  if (!record.controlled) return;
  for (const event of events) {
    const position = record.position.clone();
    if (event.type === "step") {
      const side = event.side ? 1 : -1;
      position.x += Math.cos(record.facing) * 0.12 * side;
      position.z -= Math.sin(record.facing) * 0.12 * side;
      position.y += 0.02;
      if (record.body.waterDepth > 0.15) {
        emitPlayerWaterEffect("ripple", position.clone().setY(record.body.waterY), 0.45);
      } else if (event.run) {
        emitPlayerParticles("dust", position, { count: 3, scale: 0.55 });
      }
      dispatchPlayerEvent("step", { run: event.run, side, pos: position, agentId: record.id });
    } else if (event.type === "paddle") {
      emitPlayerWaterEffect("ripple", position.setY(record.body.waterY), 0.6);
      dispatchPlayerEvent("paddle", { ...event, pos: position, agentId: record.id });
    }
  }
}
