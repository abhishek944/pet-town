import { creaturesState } from "../state.js";
export function creatureActorPosed(deltaTime, frame) {
  this.goal = null;
  this.faceYaw = this.pose.yaw;
  let position2 = creaturesState.creaturesRuntime.ctx.camera.position;
  if (this.lookT <= 0) {
    if (this.rng() < 0.85) {
      this.look = position2.clone();
      this.tiltGoal = this.rng() < 0.5 ? this.rng.sign() * 0.22 : 0;
    } else {
      this.randomLook();
    }
    this.lookT = this.rng.range(1.2, 2.8);
  }
  let state2 = this.pose.state;
  if (state2 === `sleep`) {
    this.state = `sleep`;
  } else {
    if (state2 === `rest`) {
      this.state = `rest`;
      this.t = 0;
      this.dur = 1e9;
    } else {
      if (state2 === `happy`) {
        this.state = `happy`;
        if (this.happyT <= 0) {
          this.happyT = 1.5;
          this.idleHop = 1;
        }
      } else {
        if (state2 === `walk`) {
          this.state = `wander`;
          this.moveAmt = 1;
        } else {
          this.state = `idle`;
        }
      }
    }
  }
  if (this.def.flight) {
    this.flying = state2 !== `sleep` && state2 !== `rest`;
    this.alt = this.flying ? 0.55 : 0;
  } else if (this.flyer && state2 !== `sleep`) {
    this.flying = true;
    this.alt = 0.55;
  }
  if (state2 === `emote` && this.emoter.kind === null && this.rng() < deltaTime * 0.8) {
    this.emote(this.rng.pick(this.def.emotes), 1.6, true);
  }
}
