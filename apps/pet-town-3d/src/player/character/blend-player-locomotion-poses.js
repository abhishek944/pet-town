import { lerpPlayerAnimationValue } from "../animation-math/lerp-player-animation-value.js";
import { clampPlayerAnimationValue } from "../animation-math/clamp-player-animation-value.js";
export function blendPlayerLocomotionPoses(
  runWeight,
  moveWeight,
  time,
  stepCos,
  blendPose,
  groundWeight,
  stepSin,
  phase,
  frame,
  airWeight,
  glideWeight,
  swimWeight,
  deltaTime,
  pose,
) {
  {
    let result27 = lerpPlayerAnimationValue(0.62, 1, runWeight) * moveWeight;
    let result28 = lerpPlayerAnimationValue(0.55, 1.4, runWeight) * moveWeight;
    let result29 = lerpPlayerAnimationValue(0.03, 0.05, runWeight) * moveWeight;
    let result30 = lerpPlayerAnimationValue(0.045, 0.075, runWeight) * moveWeight;
    let result31 = Math.sin(time * 2.3);
    let lerpPlayerAnimationValueResult2 = lerpPlayerAnimationValue(0.75, 1.35, runWeight);
    let result32 = Math.max(0, stepCos);
    let result33 = Math.max(0, -stepCos);
    let result34 = moveWeight * (0.1 + lerpPlayerAnimationValueResult2 * result32);
    let result35 = moveWeight * (0.1 + lerpPlayerAnimationValueResult2 * result33);
    let result36 = 0.14 + (0.3 + 1 * runWeight) * moveWeight;
    blendPose(groundWeight, {
      llx: -stepSin * result27 - 0.25 * result32 * moveWeight * runWeight,
      lrx: stepSin * result27 - 0.25 * result33 * moveWeight * runWeight,
      fl: result32 * result29,
      fr: result33 * result29,
      kl: result34,
      kr: result35,
      fpl: -result34 * 0.55 + stepSin * 0.22 * moveWeight,
      fpr: -result35 * 0.55 - stepSin * 0.22 * moveWeight,
      alx: stepSin * result28 - 0.2 * runWeight * moveWeight,
      arx: -stepSin * result28 - 0.2 * runWeight * moveWeight,
      el: -(result36 + 0.25 * moveWeight * Math.max(0, -stepSin)),
      er: -(result36 + 0.25 * moveWeight * Math.max(0, stepSin)),
      alz: 0.16 + 0.22 * runWeight * moveWeight + (1 - moveWeight) * 0.04 * result31,
      arz: -(0.16 + 0.22 * runWeight * moveWeight + (1 - moveWeight) * 0.04 * result31),
      hy: result30 * Math.cos(2 * phase) - result30 * 0.3 + (1 - moveWeight) * 0.006 * result31,
      hx: 0.08 * moveWeight + 0.35 * runWeight * moveWeight,
      hz:
        stepSin * lerpPlayerAnimationValue(0.07, 0.045, runWeight) * moveWeight +
        (1 - moveWeight) * 0.022 * Math.sin(time * 1.1),
      hry: stepSin * 0.14 * moveWeight,
      ty: -stepSin * 0.07 * moveWeight,
      nx:
        -0.05 * moveWeight -
        0.24 * runWeight * moveWeight +
        Math.cos(2 * phase) * 0.035 * moveWeight +
        (1 - moveWeight) * 0.02 * Math.sin(time * 2.3 + 0.6),
      ny: -stepSin * 0.1 * moveWeight,
      nz: -stepSin * 0.04 * moveWeight + (1 - moveWeight) * 0.03 * Math.sin(time * 0.8),
    });
  }
  {
    let clampPlayerAnimationValueResult5 = clampPlayerAnimationValue(frame.vy / 9, -1, 1);
    let result37 = Math.max(0, -clampPlayerAnimationValueResult5);
    let result38 = Math.max(0, clampPlayerAnimationValueResult5);
    let result39 = 1 - Math.min(1, Math.abs(frame.vy) / 6);
    let result40 = Math.sin(time * 19) * 0.3 * result37;
    blendPose(airWeight, {
      alz: 1.2 + 1.4 * result38 + 0.75 * result39 + 0.7 * result37 + result40,
      arz: -(1.2 + 1.4 * result38 + 0.75 * result39 + 0.7 * result37 - result40),
      alx: -0.9 * result38 - 0.3 * result39 - 0.2,
      arx: -0.7 * result38 - 0.2 * result39,
      llx:
        -0.55 * result38 - 0.75 * result39 - 0.1 * result37 + Math.sin(time * 13) * 0.15 * result37,
      lrx:
        0.2 * result38 - 0.5 * result39 - 0.25 * result37 - Math.sin(time * 13) * 0.15 * result37,
      fl: 0.04 * result38 + 0.05 * result39,
      fpl: 0.2 * result39 - 0.2,
      fpr: 0.1 * result39 - 0.25,
      kl: 0.35 + 0.35 * result38 + 0.6 * result39,
      kr: 0.25 + 0.3 * result38 + 0.6 * result39 + 0.15 * result37,
      el: -0.2 - 0.25 * result38,
      er: -0.2 - 0.25 * result38,
      hx: 0.02 - 0.08 * result38 + 0.12 * result37,
      nx: -0.2 * result38 - 0.1 * result39 + 0.1 * result37,
      mouth: 0.8 + 0.2 * result37,
      hy: 0,
    });
  }
  {
    let result41 = Math.sin(time * 6.5);
    blendPose(glideWeight, {
      alz: 2.55,
      alx: -0.12,
      arz: -1.15 + Math.sin(time * 4.2) * 0.18,
      arx: -0.3,
      llx: result41 * 0.35 - 0.15,
      lrx: -result41 * 0.35 - 0.15,
      fpl: 0,
      fpr: 0,
      kl: 0.35 + 0.25 * result41,
      kr: 0.35 - 0.25 * result41,
      el: -0.1,
      er: -0.55,
      hx: 0.16,
      hz: 0,
      nx: -0.12,
      ny: 0,
      mouth: 0.35,
      leaf: 1,
      hy: 0,
    });
  }
  {
    let swimPhase2 = this.swimPhase;
    let clampPlayerAnimationValueResult6 = clampPlayerAnimationValue(frame.speed / 2.5, 0, 1);
    blendPose(swimWeight, {
      hx: lerpPlayerAnimationValue(0.35, 0.85, clampPlayerAnimationValueResult6),
      nx: -lerpPlayerAnimationValue(0.35, 0.75, clampPlayerAnimationValueResult6),
      rootY: lerpPlayerAnimationValue(0.18, 0.34, clampPlayerAnimationValueResult6),
      alx: -1.5 + Math.sin(swimPhase2) * 0.75,
      alz: 0.55 + Math.cos(swimPhase2) * 0.35,
      arx: -1.5 + Math.sin(swimPhase2 + Math.PI) * 0.75,
      arz: -(0.55 + Math.cos(swimPhase2 + Math.PI) * 0.35),
      llx: 0.35 + Math.sin(swimPhase2 * 2) * 0.4,
      lrx: 0.35 - Math.sin(swimPhase2 * 2) * 0.4,
      fpl: 0.5,
      fpr: 0.5,
      kl: 0.45 + Math.sin(swimPhase2 * 2 + 1) * 0.35,
      kr: 0.45 - Math.sin(swimPhase2 * 2 + 1) * 0.35,
      el: -0.55 - 0.35 * Math.sin(swimPhase2),
      er: -0.55 - 0.35 * Math.sin(swimPhase2 + Math.PI),
      hz: Math.sin(swimPhase2) * 0.08,
      ny: Math.sin(swimPhase2) * 0.1,
      mouth: 0.15,
    });
    if (frame.swimming && frame.speed > 0.6) {
      this.swimSplashT -= deltaTime;
      if (this.swimSplashT <= 0) {
        this.swimSplashT = 0.28;
        this.events.push({
          type: `paddle`,
        });
      }
    }
  }
  pose.hx += this.lean * (groundWeight + glideWeight * 0.5);
  pose.nx -= this.lean * 0.5 * groundWeight;
  pose.hz += this.bank * (groundWeight + glideWeight * 1.4 + swimWeight * 0.5);
  pose.nz -= this.bank * 0.4;
}
