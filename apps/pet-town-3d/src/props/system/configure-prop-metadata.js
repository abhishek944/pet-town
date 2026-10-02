/** Prop lifecycle, collision and interaction API, terrain reseating, static batches and animated prop effects. */

import { propsState } from "../state.js";
import { transformPropLocalPoint } from "./transform-prop-local-point.js";
export function configurePropMetadata(build) {
  build.registerMetadata = (itValue4, collidersValue) => {
    let it4 = itValue4.it;
    for (let result9 of collidersValue.colliders ?? []) {
      build.registerCollider(itValue4, result9);
    }
    for (let result10 of collidersValue.segs ?? []) {
      build.registerCollider(itValue4, result10);
    }
    for (let position6 of collidersValue.lights ?? []) {
      let transformPropLocalPointResult3 = transformPropLocalPoint(
        it4,
        position6.x,
        position6.y,
        position6.z,
      );
      propsState.propsRuntime.halos.push(transformPropLocalPointResult3);
      itValue4.lights.push(transformPropLocalPointResult3);
      let values2 = [
        transformPropLocalPointResult3.x,
        build.groundY(transformPropLocalPointResult3.x, transformPropLocalPointResult3.z),
        transformPropLocalPointResult3.z,
        5.2,
        5.2,
        0,
        0.5,
      ];
      propsState.propsRuntime.pools.push(values2);
      itValue4.pools.push(values2);
    }
    for (let position7 of collidersValue.windows ?? []) {
      if (position7.high) {
        continue;
      }
      let transformPropLocalPointResult4 = transformPropLocalPoint(
        it4,
        position7.x + position7.nx * 1,
        0,
        position7.z + position7.nz * 1,
      );
      let result11 = Math.atan2(position7.nx, position7.nz) + (it4.rot || 0);
      let values3 = [
        transformPropLocalPointResult4.x,
        build.groundY(transformPropLocalPointResult4.x, transformPropLocalPointResult4.z),
        transformPropLocalPointResult4.z,
        position7.door ? 1.4 : 1.8,
        position7.door ? 1.8 : 2.4,
        -result11,
        position7.door ? 0.3 : 0.42,
      ];
      propsState.propsRuntime.pools.push(values3);
      itValue4.pools.push(values3);
    }
    for (let position8 of collidersValue.clear ?? []) {
      let transformPropLocalPointResult5 = transformPropLocalPoint(
        it4,
        position8.x,
        0,
        position8.z,
      );
      build.clearings.push({
        x: transformPropLocalPointResult5.x,
        z: transformPropLocalPointResult5.z,
        radius: 0,
        small: position8.r,
      });
    }
    build.registerWalkSurfaces(itValue4, collidersValue.walk);
  };
  build.registerShade = (
    shadeValue,
    value9,
    value10,
    value11,
    value12,
    value13,
    value14,
    value15,
  ) => {
    let values4 = [value9, value10, value11, value12, value13, value14, value15];
    propsState.propsRuntime.shade.push(values4);
    shadeValue.shade.push(values4);
  };
}
