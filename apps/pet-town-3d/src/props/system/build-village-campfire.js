/** Prop lifecycle, collision and interaction API, terrain reseating, static batches and animated prop effects. */
import * as THREE from "three";
import { propsState } from "../state.js";
import { buildCampfireProp } from "../stonework/build-campfire-prop.js";
import { CampfireEmitter } from "../effects/campfire-emitter.js";
export function buildVillageCampfire(build, placement, tag) {
  placement.y = build.terrain.h(placement.x, placement.z);
  let callback2Result5 = build.beginRecord(tag, placement, {
    reseat: true,
    kind: `campfire`,
    foot: 1,
  });
  build.builder.begin(placement.x, placement.y, placement.z, 0, {
    aoH: 0.3,
    aoMin: 0.75,
  });
  let campfirePropResult = buildCampfireProp(build.builder, build.random);
  build.registerEntry(callback2Result5, `Campfire`, 1);
  build.registerMetadata(callback2Result5, campfirePropResult);
  if (!propsState.propsRuntime.fires.length) {
    callback2Result5.fire = new CampfireEmitter(
      new THREE.Vector3(placement.x, placement.y + 0.08, placement.z),
      propsState.propsRuntime.fireLight,
      3,
      propsState.propsRuntime.group,
    );
    propsState.propsRuntime.fires.push(callback2Result5.fire);
  }
  build.registerShade(
    callback2Result5,
    placement.x,
    placement.y + 0.035,
    placement.z,
    2.9,
    2.9,
    0,
    0.5,
  );
  let values5 = [placement.x, placement.y + 0.04, placement.z, 7, 7, 0, 0.55, 16742954];
  propsState.propsRuntime.pools.push(values5);
  callback2Result5.pools.push(values5);
}
