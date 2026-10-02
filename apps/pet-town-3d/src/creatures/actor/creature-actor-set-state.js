export function creatureActorSetState(state, duration = 3) {
  this.state = state;
  this.t = 0;
  this.dur = duration;
  this.goal = null;
  this.faceYaw = null;
  this.role = state === `play` ? this.role : null;
  if (state !== `play`) {
    this.buddy = null;
  }
}
