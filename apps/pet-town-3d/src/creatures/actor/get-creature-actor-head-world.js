import { creaturesState } from "../state.js";
export function getCreatureActorHeadWorld() {
  return creaturesState.creatureWorldPositionScratch
    .set(0, this.def.headY * this.size, 0)
    .add(this.position);
}
