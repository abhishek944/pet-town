/** Prop lifecycle, collision and interaction API, terrain reseating, static batches and animated prop effects. */
import * as THREE from "three";
import { propsState } from "../state.js";
export function configurePropRecords(build) {
  build.beginRecord = (value4, position2, kindValue = {}) => {
    let options3 = {
      tag: value4,
      it: position2,
      x: position2.x,
      z: position2.z,
      y: position2.y,
      h0: build.terrain.h(position2.x, position2.z),
      kind: kindValue.kind ?? position2.type,
      reseat: !!kindValue.reseat,
      foot: kindValue.foot ?? 0.3,
      mode: kindValue.mode,
      entry: null,
      cols: [],
      walk: [],
      lights: [],
      pools: [],
      shade: [],
      fire: null,
    };
    propsState.propsRuntime.recs.set(value4, options3);
    build.builder.tag = value4;
    return options3;
  };
  build.registerEntry = (itValue, value5, value6, value7 = {}) => {
    let it2 = itValue.it;
    let options4 = {
      type: it2.type,
      name: value5,
      x: it2.x,
      y: it2.y,
      z: it2.z,
      rot: it2.rot || 0,
      radius: value6,
      pos: new THREE.Vector3(it2.x, it2.y, it2.z),
      ...value7,
    };
    propsState.propEntries.push(options4);
    itValue.entry = options4;
    return options4;
  };
}
