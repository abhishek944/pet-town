/** Prop lifecycle, collision and interaction API, terrain reseating, static batches and animated prop effects. */
import { propsState } from "../state.js";
export function propsClearVegetationAroundProps() {
  let vegetation2 = propsState.propsRuntime.ctx.vegetation;
  if (typeof vegetation2?.clearArea == `function`) {
    try {
      for (let position of propsState.propVegetationClearings) {
        if (position.radius > 0) {
          vegetation2.clearArea(
            {
              x: position.x,
              y: 0,
              z: position.z,
            },
            position.radius,
            {
              transient: true,
              trees: true,
              small: false,
            },
          );
        }
        if (position.small > 0) {
          vegetation2.clearArea(
            {
              x: position.x,
              y: 0,
              z: position.z,
            },
            position.small,
            {
              transient: true,
              trees: false,
              small: true,
            },
          );
        }
      }
      for (let position2 of propsState.propColliders) {
        if (position2.kind !== `segment`) {
          vegetation2.clearArea(
            {
              x: position2.x,
              y: position2.y0,
              z: position2.z,
            },
            (position2.hx == null ? position2.radius : Math.max(position2.hx, position2.hz)) + 0.25,
            {
              transient: true,
              trees: false,
              small: true,
            },
          );
        }
      }
    } catch {}
    propsState.propsRuntime.vegCount = vegetation2.trees?.length ?? 0;
  }
}
