import { updateBirdIntent } from "../flight/update-bird-intent.js";
import { updateCreatureIntent } from "./update-creature-intent.js";
export function creatureActorThink(deltaTime, frame) {
  this.t += deltaTime;
  this.emoteCd -= deltaTime;
  this.playerCd -= deltaTime;
  let traits = this.traits;
  let night = frame.night;
  let wantsSleep = traits.nightOwl
    ? night < 0.15 && frame.noonish && this.sleepBias > 0.05
    : night > 0.55 + this.sleepBias;
  let player = frame.player;
  if (this.pose) {
    return this.posed(deltaTime, frame);
  }
  if (this.def.flight) return updateBirdIntent.call(this, deltaTime, frame);
  if (this.state === `sleep`) {
    this.goal = null;
    if (!wantsSleep && this.t > 2 + this.sleepBias * 20) {
      this.setState(`idle`, 1.5);
      this.emote(`sparkle`, 1.4, true);
      this.sq.kick(3);
      this.mouthOpenT = 0.7;
    } else {
      this.happyT;
    }
    return;
  }
  if (wantsSleep && this.state !== `flee` && this.state !== `happy`) {
    if (this.flying || this.flyH > 0.05) {
      if (this.state !== `land`) {
        this.state = `land`;
        this.t = 0;
        this.goal = null;
      }
    } else if (!this.inWater) {
      this.setState(`sleep`, 999);
      this.mouthOpenT = 0.9;
      this.sq.kick(2.5);
      return;
    }
  }
  if (this.state === `happy`) {
    this.goal = null;
    if (player) {
      this.look = player.clone().setY(player.y + 1.2);
    }
    if (this.t > this.dur) {
      this.setState(player ? `greet` : `idle`, 3);
    }
    return;
  }
  if (
    player &&
    this.playerCd <= 0 &&
    this.state !== `flee` &&
    this.state !== `approach` &&
    this.state !== `greet`
  ) {
    let hypotResult = Math.hypot(player.x - this.position.x, player.z - this.position.z);
    if (hypotResult < (frame.playerSpeed > 5.5 ? 4.5 : 3.2) && this.rng() < traits.shy) {
      this.startFlee(player);
      return;
    }
    if (hypotResult < 6.5 && hypotResult > 2.2 && this.rng() < traits.curious * 0.5) {
      this.setState(`approach`, 7);
      this.emote(this.rng() < 0.5 ? `exclaim` : `question`, 1.3, true);
      this.tiltGoal = this.rng.sign() * 0.3;
      this.playerCd = 12;
      return;
    }
    this.playerCd = this.rng.range(2, 4);
  }
  return updateCreatureIntent.call(this, player, deltaTime, frame, wantsSleep);
}
