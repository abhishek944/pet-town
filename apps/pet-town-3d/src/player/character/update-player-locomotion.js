import { updatePlayerLocomotionWeights } from "./update-player-locomotion-weights.js";
import { blendPlayerLocomotionPoses } from "./blend-player-locomotion-poses.js";

// One locomotion stage for Pip and companion rigs. Gaze and character-specific
// presentation can amend the resulting pose before the common body application.
export function updatePlayerLocomotion(deltaTime, frame) {
  this.t += deltaTime;
  this.events.length = 0;
  const weights = updatePlayerLocomotionWeights.call(this, frame, deltaTime);
  const pose = {
    hy: 0,
    hx: 0,
    hry: 0,
    hz: 0,
    tx: 0,
    ty: 0,
    nx: 0,
    ny: 0,
    nz: 0,
    alx: 0,
    alz: 0,
    arx: 0,
    arz: 0,
    llx: 0,
    llz: 0,
    lrx: 0,
    lrz: 0,
    fl: 0,
    fr: 0,
    fpl: 0,
    fpr: 0,
    mouth: 0,
    leaf: 0,
    rootY: 0,
    kl: 0,
    kr: 0,
    el: 0,
    er: 0,
  };
  const blendPose = (weight, values) => {
    if (!(weight < 0.001)) {
      for (const key in values) pose[key] += values[key] * weight;
    }
  };
  blendPlayerLocomotionPoses.call(
    this,
    weights.runWeight,
    weights.moveWeight,
    this.t,
    weights.stepCos,
    blendPose,
    weights.groundWeight,
    weights.stepSin,
    weights.phase,
    frame,
    weights.airWeight,
    weights.glideWeight,
    weights.swimWeight,
    deltaTime,
    pose,
  );
  return { ...weights, pose, time: this.t };
}
