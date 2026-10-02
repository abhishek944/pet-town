/** Deterministic settlement layout, buildings, connecting footpaths, lamps, props and bridge site selection. */

import { facePropTowardCardinalPoint } from "../terrain-placement/face-prop-toward-cardinal-point.js";
import { transformPropGroundPoint } from "../terrain-placement/transform-prop-ground-point.js";
import { getValidWindmillRotations } from "../terrain-placement/get-valid-windmill-rotations.js";
import { sampleWindmillEntranceTerrain } from "../terrain-placement/sample-windmill-entrance-terrain.js";
import { getWindmillPlacementAccess } from "../terrain-placement/get-windmill-placement-access.js";
export function placeVillageBuildings(village) {
  village.mainCottage = village.placeCottage(`main`, -8, -6, 7);
  village.cabin = village.placeCottage(`cabin`, -9.5, 8.5, 7);
  village.hill = village.context.terrain?.landmarks?.hill;
  village.windmillOffsetX = 4;
  village.windmillOffsetZ = -15;
  if (
    Number.isFinite(village.hill?.x) &&
    Math.hypot(village.hill.x - village.plaza.x, village.hill.z - village.plaza.z) < 26
  ) {
    village.windmillOffsetX = village.hill.x - village.plaza.x;
    village.windmillOffsetZ = village.hill.z - village.plaza.z;
  }
  village.windmillRequirements = {
    hw: 2.6,
    hd: 2.6,
    r: 4.8,
    preferHigh: true,
    flatW: 1.6,
    maxRange: 1,
    rot: 0,
    check: (position6) =>
      getValidWindmillRotations(
        village.terrain,
        position6,
        facePropTowardCardinalPoint(
          position6.x,
          position6.z,
          village.plaza.x + 6,
          village.plaza.z + 6,
        ),
      ).length > 0,
  };
  village.windmill =
    village.placeBuilding(`windmill`, village.windmillOffsetX, village.windmillOffsetZ, {
      ...village.windmillRequirements,
      searchR: 7,
    }) ??
    village.placeBuilding(`windmill`, 4, -15, {
      ...village.windmillRequirements,
      searchR: 9,
    }) ??
    village.placeBuilding(`windmill`, 4, -15, {
      ...village.windmillRequirements,
      searchR: 9,
      maxRange: 2,
    });
  if (village.windmill) {
    let facePropTowardCardinalPointResult = facePropTowardCardinalPoint(
      village.windmill.x,
      village.windmill.z,
      village.plaza.x + 6,
      village.plaza.z + 6,
    );
    let validWindmillRotationsResult = getValidWindmillRotations(
      village.terrain,
      village.windmill,
      facePropTowardCardinalPointResult,
    );
    let result34 = validWindmillRotationsResult[0] ?? facePropTowardCardinalPointResult;
    let result35 = 1 / 0;
    for (let result36 of validWindmillRotationsResult) {
      let result37 =
        Math.abs(
          sampleWindmillEntranceTerrain(village.terrain, {
            ...village.windmill,
            rot: result36,
          }).near,
        ) + (result36 === facePropTowardCardinalPointResult ? 0 : 0.35);
      if (result37 < result35) {
        result35 = result37;
        result34 = result36;
      }
    }
    village.windmill.rot = result34;
    let windmillPlacementAccessResult = getWindmillPlacementAccess(
      village.terrain,
      village.windmill,
    );
    Object.assign(village.windmill, {
      frontGround: windmillPlacementAccessResult.frontGround,
      front: windmillPlacementAccessResult.front,
    });
    village.entrances.push(windmillPlacementAccessResult.front);
  }
  village.stall = village.placeBuilding(`stall`, 7.5, -5, {
    hw: 2.4,
    hd: 1.6,
    r: 2.6,
    searchR: 5,
    maxRange: 1,
  });
  if (village.stall) {
    village.entrances.push(transformPropGroundPoint(village.stall, 0, 2.3));
  }
  village.campfire = village.placeBuilding(`campfire`, 1.5, 2, {
    hw: 1,
    hd: 1,
    r: 1.1,
    searchR: 3,
    base: `center`,
    maxRange: 0.5,
  });
  village.garden = village.placeBuilding(`garden`, 8, 8, {
    hw: 3.8,
    hd: 2.9,
    r: 4.4,
    searchR: 6,
  });
  if (village.garden) {
    village.entrances.push(transformPropGroundPoint(village.garden, 0, 3.4));
  }
}
