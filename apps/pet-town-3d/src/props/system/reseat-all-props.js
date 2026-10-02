/** Prop lifecycle, collision and interaction API, terrain reseating, static batches and animated prop effects. */
import { propsState } from "../state.js";
import { reseatDirtyProps } from "./reseat-dirty-props.js";
export function reseatAllProps() {
  for (let result of propsState.propsRuntime.recs.values()) {
    if (result.reseat) {
      propsState.propsRuntime.dirty.add(result);
    }
  }
  reseatDirtyProps();
}
