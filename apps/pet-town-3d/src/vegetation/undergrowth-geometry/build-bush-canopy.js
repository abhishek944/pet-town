/** Bushes, ferns, saplings, clover, mushrooms, reeds and fallen logs. */
import * as THREE from "three";
import { vegetationState } from "../state.js";
import { createCanopyClumps } from "../canopy-geometry/create-canopy-clumps.js";
import { scaleGeometryAroundCenter } from "../tree-geometry/scale-geometry-around-center.js";
import { mergeFoliageGeometry } from "../geometry-helpers/merge-foliage-geometry.js";
export function buildBushCanopy(bush) {
  bush.radius = bush.settings.R ?? 0.75 + bush.random() * 0.25;
  bush.center = new THREE.Vector3(0, bush.radius * 0.62, 0);
  bush.clumps = [
    {
      x: 0,
      y: bush.center.y,
      z: 0,
      w: bush.radius * 1.45,
      h: bush.radius * 1.15,
      d: bush.radius * 1.45,
      ry: bush.random() * vegetationState.foliageFullTurn,
    },
  ];
  bush.clumpCount = 3 + Math.floor(bush.random() * 2);
  for (let index2 = 0; index2 < bush.clumpCount; index2++) {
    let result4 =
      (index2 / bush.clumpCount) * vegetationState.foliageFullTurn + bush.random() * 0.7;
    let result5 = bush.radius * (0.55 + bush.random() * 0.15);
    let result6 = bush.radius * (0.8 + bush.random() * 0.25);
    bush.clumps.push({
      x: Math.cos(result4) * result5,
      y: result6 * 0.42,
      z: Math.sin(result4) * result5,
      w: result6,
      h: result6 * 0.85,
      d: result6,
      ry: bush.random() * vegetationState.foliageFullTurn,
    });
  }
  bush.seed = Math.floor(bush.random() * 1e6);
  bush.canopyStyle = {
    stops: bush.settings.stops ?? vegetationState.foliageColorRamps.bush,
    swayBase: 0.35,
    aoMin: 0.55,
    dispAmp: 0.06,
    dispFreq: 1.8,
    seed: bush.seed,
  };
  ({ parts: bush.parts, fringe: bush.fringe } = createCanopyClumps(
    bush.random,
    bush.clumps,
    bush.center,
    bush.radius,
    {
      ...bush.canopyStyle,
      seg: 2,
      cards: 0.5,
      cardSize: [0.14, 0.28],
    },
  ));
  bush.lodParts = createCanopyClumps(bush.random, bush.clumps, bush.center, bush.radius, {
    ...bush.canopyStyle,
    seg: 1,
    cards: 0,
  }).parts;
  bush.shadow = scaleGeometryAroundCenter(
    mergeFoliageGeometry(bush.lodParts.slice(0, bush.clumps.length)),
    bush.center,
    0.88,
  );
}
