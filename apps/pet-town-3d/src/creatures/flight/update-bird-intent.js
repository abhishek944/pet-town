import { birdRestHeight } from "./sample-bird-clearance.js";
import { birdPadding, pickBirdGoal } from "./pick-bird-goal.js";

export function updateBirdIntent(deltaTime, frame) {
  const profile = this.def.flight;
  const runtime = (this.birdRuntime ??= {
    active: profile.activity === "night" ? frame.night > 0.35 : frame.night < 0.5,
    orbit: this.rng() * Math.PI * 2,
    flightTime: 0,
    restTime: this.rng.range(1, 4),
    landing: false,
    restY: null,
    retry: 0,
  });
  const wasActive = runtime.active;
  if (frame.night > 0.55) runtime.active = profile.activity === "night";
  else if (frame.night < 0.25) runtime.active = profile.activity === "day";
  runtime.flightTime += this.flying ? deltaTime : 0;
  runtime.restTime -= deltaTime;
  runtime.retry -= deltaTime;
  if (this.state === "happy" && this.t < this.dur) {
    this.goal = null;
    if (frame.player) this.look = frame.player.clone().setY(frame.player.y + 1.2);
    return;
  }
  if (!this.flying) {
    const rest = birdRestHeight(this.position.x, this.position.z, birdPadding(this));
    if (rest == null || (runtime.active && runtime.restTime <= 0)) {
      this.flying = true;
      runtime.landing = false;
      this.setState("fly", 30);
    } else {
      this.goal = null;
      const state = runtime.active ? "rest" : "sleep";
      if (this.state !== state) this.setState(state, 999);
      return;
    }
  }
  if (wasActive && !runtime.active && !runtime.landing) this.goal = null;
  if (
    this.goal &&
    runtime.landing &&
    birdRestHeight(this.goal.x, this.goal.z, birdPadding(this)) == null
  ) {
    this.goal = null;
    runtime.landing = false;
  }
  const progressing = runtime.landing ? (runtime.stalled ?? 0) < 6 : this.t < 30;
  if (this.goal && this.state !== "happy" && progressing) return;
  this.goal = null;
  if (runtime.retry > 0) return;
  const shouldRest = !runtime.active || runtime.flightTime > (profile.pattern === "dart" ? 24 : 42);
  if (!pickBirdGoal(this, shouldRest)) {
    // If no safe landing exists, stay airborne and try another route before retrying.
    if (shouldRest) pickBirdGoal(this, false);
    runtime.retry = 2;
  }
}
