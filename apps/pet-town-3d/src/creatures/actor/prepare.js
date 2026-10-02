/** Creature state machine, social behavior, movement, animation and interaction methods. */
import { creaturesState } from "../state.js";
export function prepareCreaturesActor() {
  creaturesState.nextCreatureId = 0;
}
