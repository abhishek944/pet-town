/** Prop lifecycle, collision and interaction API, terrain reseating, static batches and animated prop effects. */

import { propsState } from "../state.js";
import { transformPropLocalPoint } from "./transform-prop-local-point.js";
import { getCottagePlacementAccess } from "../terrain-placement/get-cottage-placement-access.js";
import { buildCottageProp } from "../cottages/build-cottage-prop.js";
import { sampleCottageBackDoorGroundOffset } from "./sample-cottage-back-door-ground-offset.js";
import { ChimneySmokeEmitter } from "../effects/chimney-smoke-emitter.js";
export function buildVillageCottage(build, placement, tag) {
  let result15 = placement.opts?.variant ?? `main`;
  let result16 = propsState.cottageVariants[result15] ?? propsState.cottageVariants.main;
  let cottagePlacementAccessResult = getCottagePlacementAccess(build.terrain, placement);
  let callback2Result2 = build.beginRecord(tag, placement);
  build.builder.begin(placement.x, placement.y, placement.z, placement.rot, {
    aoH: 1.1,
    aoMin: 0.7,
  });
  let cottagePropResult = buildCottageProp(build.builder, build.random, {
    ...result16,
    found: placement.found,
    frontGround: cottagePlacementAccessResult.frontGround,
    backDoor: !!placement.opts?.backDoor,
    backGround: sampleCottageBackDoorGroundOffset(build.terrain, placement, result16),
  });
  build.registerMetadata(callback2Result2, cottagePropResult);
  let position11 =
    callback2Result2.walk.find((yValue) => Math.abs(yValue.y - (placement.y + 0.5)) < 0.001) ??
    callback2Result2.walk.at(-1);
  build.registerEntry(callback2Result2, result15 === `main` ? `Cottage` : `Cabin`, 3.2, {
    porch: position11
      ? {
          x: position11.x,
          z: position11.z,
          hx: position11.hx,
          hz: position11.hz,
          y: position11.y,
        }
      : null,
    door: transformPropLocalPoint(
      placement,
      cottagePropResult.door.x,
      cottagePropResult.door.y,
      cottagePropResult.door.z,
    ),
  });
  if (cottagePropResult.chimney) {
    propsState.propsRuntime.smokes.push(
      new ChimneySmokeEmitter(
        transformPropLocalPoint(
          placement,
          cottagePropResult.chimney.x,
          cottagePropResult.chimney.y,
          cottagePropResult.chimney.z,
        ),
        11 + build.placementCount,
        result15 === `main` ? 16 : 12,
      ),
    );
  }
  build.placementCount++;
}
