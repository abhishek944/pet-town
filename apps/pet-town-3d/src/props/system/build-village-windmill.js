/** Prop lifecycle, collision and interaction API, terrain reseating, static batches and animated prop effects. */
import * as THREE from "three";
import { propsState } from "../state.js";
import { PropGeometryBuilder } from "../geometry-builder/prop-geometry-builder.js";
import { transformPropLocalPoint } from "./transform-prop-local-point.js";
import { getWindmillPlacementAccess } from "../terrain-placement/get-windmill-placement-access.js";
import { buildWindmillTowerProp } from "../windmills/build-windmill-tower-prop.js";
import { buildWindmillSailsGeometry } from "../windmills/build-windmill-sails-geometry.js";
export function buildVillageWindmill(build, placement, tag) {
  let windmillPlacementAccessResult = getWindmillPlacementAccess(build.terrain, placement);
  let callback2Result3 = build.beginRecord(tag, placement);
  let result17 = +(build.context.params?.get?.(`propsDebugMillDrop`) ?? NaN);
  build.builder.begin(placement.x, placement.y, placement.z, placement.rot, {
    aoH: 1.2,
    aoMin: 0.7,
  });
  let windmillTowerPropResult = buildWindmillTowerProp(build.builder, build.random, {
    found: placement.found + (Number.isFinite(result17) ? result17 : 0),
    frontGround: Number.isFinite(result17) ? -result17 : windmillPlacementAccessResult.frontGround,
  });
  build.registerEntry(callback2Result3, `Windmill`, 2.5);
  build.registerMetadata(callback2Result3, windmillTowerPropResult);
  let propGeometryBuilder2 = new PropGeometryBuilder(5);
  propGeometryBuilder2.begin(0, 0, 0, 0, {
    aoH: 0.01,
    aoMin: 1,
  });
  buildWindmillSailsGeometry(propGeometryBuilder2, build.random);
  let Result2 = propGeometryBuilder2.build(propsState.propsRuntime.mats);
  let group2 = new THREE.Group();
  group2.position.copy(
    transformPropLocalPoint(
      placement,
      windmillTowerPropResult.hub.x,
      windmillTowerPropResult.hub.y,
      windmillTowerPropResult.hub.z,
    ),
  );
  group2.rotation.y = placement.rot;
  group2.add(Result2);
  propsState.propsRuntime.group.add(group2);
  propsState.propsRuntime.blades.push(Result2);
  propsState.propsRuntime.statics.push(group2);
}
