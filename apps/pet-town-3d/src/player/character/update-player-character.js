import { updatePlayerLocomotion } from "./update-player-locomotion.js";
import { animatePlayerGaze } from "./animate-player-gaze.js";
import { animatePlayerFidget } from "./animate-player-fidget.js";
import { applyPlayerBodyPose } from "./apply-player-body-pose.js";
import { animatePlayerGlider } from "./animate-player-glider.js";
import { animatePlayerSecondaryMotion } from "./animate-player-secondary-motion.js";
import { animatePlayerExpressions } from "./animate-player-expressions.js";
export function updatePlayerCharacter(deltaTime, frame) {
  const {
    groundWeight,
    airWeight,
    glideWeight,
    swimWeight,
    moveWeight,
    runWeight,
    phase,
    acceleration,
    pose,
    time,
  } = updatePlayerLocomotion.call(this, deltaTime, frame);
  animatePlayerGaze.call(this, frame, moveWeight, deltaTime, pose);
  let stretchAmount;
  ({ stretchAmount } = animatePlayerFidget.call(this, deltaTime, moveWeight, frame, pose));
  let squashAmount;
  ({ squashAmount } = applyPlayerBodyPose.call(
    this,
    deltaTime,
    frame,
    glideWeight,
    groundWeight,
    runWeight,
    moveWeight,
    phase,
    time,
    swimWeight,
    acceleration,
    pose,
  ));
  animatePlayerGlider.call(this, pose, deltaTime, time);
  animatePlayerSecondaryMotion.call(
    this,
    deltaTime,
    glideWeight,
    airWeight,
    frame,
    time,
    runWeight,
    moveWeight,
    swimWeight,
  );
  animatePlayerExpressions.call(
    this,
    deltaTime,
    frame,
    squashAmount,
    stretchAmount,
    moveWeight,
    glideWeight,
    airWeight,
    pose,
  );
  return this.events;
}
