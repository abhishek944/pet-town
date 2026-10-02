/** Prop lifecycle, collision and interaction API, terrain reseating, static batches and animated prop effects. */

import { propsState } from "../state.js";
import { transformPropLocalPoint } from "./transform-prop-local-point.js";
export function configurePropColliders(build) {
  build.registerCollider = (itValue2, position3) => {
    let it3 = itValue2.it;
    let result3 = it3.rot || 0;
    if (position3.kind === `segment` || position3.x1 != null) {
      let position4 = position3.world
        ? {
            x: position3.x1,
            z: position3.z1,
          }
        : transformPropLocalPoint(it3, position3.x1, 0, position3.z1);
      let position5 = position3.world
        ? {
            x: position3.x2,
            z: position3.z2,
          }
        : transformPropLocalPoint(it3, position3.x2, 0, position3.z2);
      let options6 = {
        kind: `segment`,
        x1: position4.x,
        z1: position4.z,
        x2: position5.x,
        z2: position5.z,
        r: position3.r ?? 0.1,
        y0: (position3.world ? 0 : it3.y) + (position3.y0 ?? 0),
        h: position3.h ?? 1.2,
        noTop: position3.noTop !== false,
      };
      propsState.propColliders.push(options6);
      itValue2.cols.push(options6);
      return options6;
    }
    let transformPropLocalPointResult = transformPropLocalPoint(
      it3,
      position3.x ?? 0,
      0,
      position3.z ?? 0,
    );
    let options5 = {
      x: transformPropLocalPointResult.x,
      z: transformPropLocalPointResult.z,
      radius: position3.radius ?? 0.3,
      y0: it3.y + (position3.y0 ?? 0),
      h: position3.h ?? 1.5,
    };
    if ((position3.noTop && (options5.noTop = true), position3.w)) {
      let result4 = (position3.rot ?? 0) + result3;
      let result5 = Math.abs(Math.cos(result4));
      let result6 = Math.abs(Math.sin(result4));
      Object.assign(options5, {
        w: position3.w,
        d: position3.d,
        rot: result4,
        hx: (position3.w * result5 + position3.d * result6) / 2,
        hz: (position3.w * result6 + position3.d * result5) / 2,
      });
    }
    propsState.propColliders.push(options5);
    itValue2.cols.push(options5);
    return options5;
  };
  build.registerWalkSurfaces = (itValue3, value8) => {
    for (let result7 of value8 ?? []) {
      let transformPropLocalPointResult2 = transformPropLocalPoint(
        itValue3.it,
        result7.cx,
        result7.y,
        result7.cz,
      );
      let result8 = Math.abs(Math.round(Math.sin(itValue3.it.rot || 0))) === 1;
      let options7 = {
        x: transformPropLocalPointResult2.x,
        z: transformPropLocalPointResult2.z,
        hx: result8 ? result7.hd : result7.hw,
        hz: result8 ? result7.hw : result7.hd,
        y: transformPropLocalPointResult2.y,
      };
      propsState.propsRuntime.walk.push(options7);
      itValue3.walk.push(options7);
    }
  };
}
