import { creaturesState } from "../state.js";
export function creatureActorTryPlay(frame) {
  let result = null;
  let result2 = 7;
  for (let result4 of creaturesState.creaturesRuntime.list) {
    if (
      result4 === this ||
      result4.pose ||
      ![`idle`, `wander`, `look`, `graze`, `fly`].includes(result4.state) ||
      result4.flyer !== this.flyer
    ) {
      continue;
    }
    let distanceToResult = result4.position.distanceTo(this.position);
    if (distanceToResult < result2) {
      result2 = distanceToResult;
      result = result4;
    }
  }
  if (!result) {
    return false;
  }
  let result3 = this.rng() < 0.5 ? `chase` : `bounce`;
  this.setState(`play`, this.rng.range(5, 8));
  result.setState(`play`, this.dur);
  this.buddy = result;
  result.buddy = this;
  this.role = result3 === `chase` ? `lead` : `bounce`;
  result.role = result3 === `chase` ? `follow` : `bounce`;
  this.emote(`note`, 1.4, true);
  result.emote(`music2`, 1.4, true);
  return true;
}
