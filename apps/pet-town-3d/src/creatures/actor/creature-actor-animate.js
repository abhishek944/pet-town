import { animateCreatureHop } from "./animate-creature-hop.js";
import { animateCreatureTorso } from "./animate-creature-torso.js";
import { animateCreatureAppendages } from "./animate-creature-appendages.js";
import { animateCreatureHead } from "./animate-creature-head.js";
import { animateCreatureExpressions } from "./animate-creature-expressions.js";
import { creaturesState } from "../state.js";
import { dampCreatureValue } from "../math/damp-creature-value.js";
export function creatureActorAnimate(deltaTime, frame) {
  let parts = this.parts;
  let species = this.def;
  let gait = species.gait;
  let time = creaturesState.creaturesRuntime.time;
  let isFlying = this.flying || this.flyH > 0.15;
  let isSleeping = this.state === `sleep`;
  this.sleep = dampCreatureValue(this.sleep, +!!isSleeping, 3, deltaTime);
  let isResting = this.state === `rest`;
  this.lie = dampCreatureValue(this.lie ?? 0, isSleeping || isResting ? 1 : 0, 3, deltaTime);
  let lieAmount = this.lie;
  let sleepPose = species.sleepPose;
  this.happyT -= deltaTime;
  this.mouthOpenT -= deltaTime;
  this.lookT -= deltaTime;
  this.happy = dampCreatureValue(
    this.happy,
    +(this.happyT > 0 || this.state === `happy`),
    8,
    deltaTime,
  );
  this.graze = dampCreatureValue(this.graze, +(this.state === `graze`), 4, deltaTime);
  let moveAmount = this.moveAmt;
  let hopHeight, hopPhase;
  ({ hopHeight, hopPhase } = animateCreatureHop.call(this, gait, deltaTime, species, isFlying));
  let walkBob;
  ({ walkBob } = animateCreatureTorso.call(
    this,
    hopPhase,
    gait,
    lieAmount,
    sleepPose,
    time,
    deltaTime,
    parts,
    hopHeight,
    species,
    moveAmount,
    isFlying,
    isSleeping,
  ));
  animateCreatureAppendages.call(
    this,
    parts,
    gait,
    moveAmount,
    lieAmount,
    hopPhase,
    time,
    isFlying,
    species,
    frame,
    deltaTime,
  );
  animateCreatureHead.call(this, species, time, lieAmount, deltaTime, walkBob, sleepPose, parts);
  animateCreatureExpressions.call(this, deltaTime, isResting, parts, time, species, frame);
}
