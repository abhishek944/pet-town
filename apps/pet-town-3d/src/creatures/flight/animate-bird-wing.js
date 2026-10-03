import { dampCreatureValue } from "../math/damp-creature-value.js";

export function animateBirdWing(wing, time, isFlying, profile, deltaTime) {
  const gliding =
    isFlying &&
    this.speed > profile.cruiseSpeed * 0.65 &&
    (time + this.id * 1.7) % profile.glideEvery < profile.glideFor;
  wing.flightBlend = dampCreatureValue(wing.flightBlend ?? 0, isFlying ? 1 : 0, 6, deltaTime);
  wing.flapBlend = dampCreatureValue(wing.flapBlend ?? 1, gliding ? 0 : 1, 4, deltaTime);
  const flap = Math.sin(time * profile.wingRate + this.id) * profile.wingAmp * wing.flapBlend;
  wing.obj.rotation.z +=
    wing.side *
    (-(wing.foldAngle ?? 1.2) * (1 - wing.flightBlend) + (flap + 0.08) * wing.flightBlend);
  wing.obj.rotation.x += 1.1 * (1 - wing.flightBlend) - 0.15 * wing.flightBlend;
}
