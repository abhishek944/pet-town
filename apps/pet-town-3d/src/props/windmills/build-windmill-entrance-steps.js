/** Windmill tower and separately animated sail geometry. */
import * as THREE from "three";
import { propsState } from "../state.js";
import { createBeveledPropBox } from "../geometry/create-beveled-prop-box.js";
import { getStairLayout } from "../cottages/get-stair-layout.js";
import { appendStoneStairGeometry } from "../stonework/append-stone-stair-geometry.js";
export function buildWindmillEntranceSteps(windmill) {
  windmill.landingZ = windmill.wallFaceRadius(0.6) + 0.3;
  windmill.builder.add(`stone`, createBeveledPropBox(1.5, 0.2, 0.6, 0.06), {
    y: 0.62,
    z: windmill.landingZ,
    tint: propsState.propPalette.stoneDark,
  });
  windmill.frontGround = Math.min(0.2, windmill.settings.frontGround ?? 0);
  windmill.entranceRise = 0.66 - windmill.frontGround;
  windmill.stairs = getStairLayout(0.66, windmill.frontGround);
  if (windmill.entranceRise > 0.3) {
    appendStoneStairGeometry(
      windmill.builder,
      windmill.random,
      0,
      windmill.landingZ + 0.3,
      windmill.stairs,
      windmill.foundationDepth,
      windmill.metadata.walk,
      1.5,
    );
  } else if (windmill.frontGround > 0.8) {
    let result18 = Math.max(1, Math.round((windmill.frontGround - 0.66) / 0.27));
    appendStoneStairGeometry(
      windmill.builder,
      windmill.random,
      0,
      windmill.landingZ + 0.3,
      {
        n: result18,
        rise: -(windmill.frontGround - 0.66) / (result18 + 1),
        depth: 0.4,
        F: 0.66,
        g: windmill.frontGround,
      },
      windmill.foundationDepth,
      windmill.metadata.walk,
      1.5,
    );
  }
  windmill.metadata.walk.push({
    cx: 0,
    cz: windmill.landingZ,
    hw: 0.75,
    hd: 0.3,
    y: 0.72,
  });
  windmill.metadata.front = new THREE.Vector3(
    0,
    0,
    windmill.landingZ +
      0.4 +
      (windmill.entranceRise > 0.3 ? windmill.stairs.n * windmill.stairs.depth : 0) +
      0.5,
  );
  windmill.metadata.clear = [
    {
      x: 0,
      z: windmill.landingZ + 0.6,
      r: 1.4,
    },
  ];
}
