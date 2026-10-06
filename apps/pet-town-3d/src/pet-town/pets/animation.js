import { updatePlayerLocomotion } from "../../player/character/update-player-locomotion.js";
import { applyPlayerBodyPose } from "../../player/character/apply-player-body-pose.js";
import { animatePlayerGlider } from "../../player/character/animate-player-glider.js";

export function animatePet(character, dt, frame = {}) {
  const timeStep = Number.isFinite(dt) ? Math.max(0, Math.min(dt, 0.1)) : 0;
  // Portrait previews supply only speed/onGround. Keep that sparse contract safe
  // while actual agents supply the same complete physics frame as Pip.
  const safeFrame = {
    ...frame,
    speed: Number.isFinite(frame.speed) ? Math.max(0, frame.speed) : 0,
    runAmt: Number.isFinite(frame.runAmt) ? Math.max(0, Math.min(1, frame.runAmt)) : 0,
    vy: Number.isFinite(frame.vy) ? frame.vy : 0,
    facing: Number.isFinite(frame.facing) ? frame.facing : character.root.rotation.y,
  };
  const {
    glideWeight,
    groundWeight,
    runWeight,
    moveWeight,
    phase,
    time,
    swimWeight,
    acceleration,
    pose,
  } = updatePlayerLocomotion.call(character, timeStep, safeFrame);
  applyPlayerBodyPose.call(
    character,
    timeStep,
    safeFrame,
    glideWeight,
    groundWeight,
    runWeight,
    moveWeight,
    phase,
    time,
    swimWeight,
    acceleration,
    pose,
  );
  animatePlayerGlider.call(character, pose, timeStep, time);
  character.smile.visible = true;
  character.mouthO.visible = false;
  return character.events;
}
