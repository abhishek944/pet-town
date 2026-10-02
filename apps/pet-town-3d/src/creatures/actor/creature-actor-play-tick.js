export function creatureActorPlayTick(deltaTime, frame) {
  let buddy2 = this.buddy;
  if (!buddy2 || buddy2.state !== `play` || this.t > this.dur) {
    if (this.rng() < 0.6) {
      this.emote(this.rng() < 0.5 ? `heart` : `sparkle`, 1.4, true);
    }
    this.setState(`idle`, 2);
    return;
  }
  if (((this.look = buddy2.headWorld.clone()), (this.lookT = 0.3), this.role === `lead`)) {
    if (!this.goal || this.arrived(0.5)) {
      this.goal = this.pickTarget(3.5, this.position, {
        min: 1.5,
      });
      this.goalSpeed = this.def.run * 0.75;
    }
  } else if (this.role === `follow`) {
    let distanceToResult = buddy2.position.distanceTo(this.position);
    this.goal = distanceToResult > 0.9 ? buddy2.position.clone() : null;
    this.goalSpeed = this.def.run * 0.8;
  } else {
    this.goal = null;
    this.faceYaw = Math.atan2(
      buddy2.position.x - this.position.x,
      buddy2.position.z - this.position.z,
    );
    if (buddy2.position.distanceTo(this.position) > 1.6) {
      this.goal = buddy2.position.clone();
      this.goalSpeed = this.def.walk;
    }
    if (this.rng() < deltaTime * 1.4) {
      this.idleHop = 1;
    }
  }
  if (this.rng() < deltaTime * 0.35) {
    this.emote(this.rng.pick([`note`, `music2`, `heart`]), 1.2);
  }
}
