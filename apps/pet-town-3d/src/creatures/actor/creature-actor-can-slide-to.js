import { sampleCreatureSupportHeight } from "../world/sample-creature-support-height.js";
export function creatureActorCanSlideTo(x, z, previousHeight) {
  if (!this.canStandAt(x, z, previousHeight)) {
    return false;
  }
  let creatureSupportHeightResult = sampleCreatureSupportHeight(x, z);
  return (
    creatureSupportHeightResult == null ||
    this.flying ||
    creatureSupportHeightResult <= this.position.y + 0.12
  );
}
