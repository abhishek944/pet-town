/** Terrain, voxel and prop collision queries, walkable platforms, water and camera occlusion. */
import { playerState } from "../state.js";
export function playerWorldGatherCamOccluders(x, z, radius) {
  let camOccluders2 = this.camOccluders;
  camOccluders2.length = 0;
  let list2 = this.ctx.props?.list;
  if (!Array.isArray(list2)) {
    return;
  }
  let result = radius + 6;
  let colliders2 = this.ctx.props?.colliders;
  let values = [];
  if (Array.isArray(colliders2)) {
    for (let position of colliders2) {
      if (
        !position ||
        !(position.w > 0) ||
        !(position.h > 2.5) ||
        Math.abs(position.x - x) > result + position.w ||
        Math.abs(position.z - z) > result + position.d
      ) {
        continue;
      }
      let result2 = Number.isFinite(position.y0)
        ? position.y0
        : this.groundBelow(position.x, 60, position.z);
      let result3 = 1.7;
      camOccluders2.push({
        kind: `box`,
        minX: position.x - position.w / 2 - result3,
        maxX: position.x + position.w / 2 + result3,
        minZ: position.z - (position.d ?? position.w) / 2 - result3,
        maxZ: position.z + (position.d ?? position.w) / 2 + result3,
        minY: result2 + 2.3,
        maxY: result2 + position.h + 1,
        camOnly: true,
      });
      values.push(position);
    }
  }
  for (let position2 of list2) {
    if (
      position2 &&
      position2.type !== `garden` &&
      playerState.playerGardenOccluderPattern.test(String(position2.type ?? ``)) &&
      Math.abs(position2.x - x) < result + position2.radius &&
      Math.abs(position2.z - z) < result + position2.radius
    ) {
      let result5 = Number.isFinite(position2.y)
        ? position2.y
        : this.groundBelow(position2.x, 60, position2.z);
      camOccluders2.push({
        kind: `cyl`,
        x: position2.x,
        z: position2.z,
        r: Math.max(1, position2.radius * 0.95),
        y0: result5 + 0.4,
        y1: result5 + 2.9,
        camOnly: true,
      });
      continue;
    }
    if (
      !position2 ||
      !playerState.playerBuildingOccluderPattern.test(String(position2.type ?? ``)) ||
      !(position2.radius > 0.8) ||
      values.some(
        (position3) =>
          Math.hypot(position3.x - position2.x, position3.z - position2.z) < position2.radius,
      ) ||
      Math.abs(position2.x - x) > result + position2.radius ||
      Math.abs(position2.z - z) > result + position2.radius
    ) {
      continue;
    }
    let result4 = Number.isFinite(position2.y)
      ? position2.y
      : this.groundBelow(position2.x, 60, position2.z);
    camOccluders2.push({
      kind: `cyl`,
      x: position2.x,
      z: position2.z,
      r: Math.max(1, position2.radius * 1.05),
      y0: result4 + 1.9,
      y1: result4 + Math.min(10, 1.9 + position2.radius * 2),
      camOnly: true,
    });
  }
  let vegetation2 = this.ctx.vegetation;
  if (
    typeof vegetation2?.setCameraFade != `function` &&
    typeof vegetation2?.fadeCanopies != `function`
  ) {
    if (Array.isArray(vegetation2?.canopies)) {
      for (let position4 of vegetation2.canopies) {
        if (
          position4 &&
          Math.abs(position4.x - x) <= result + position4.r &&
          Math.abs(position4.z - z) <= result + position4.r
        ) {
          camOccluders2.push({
            kind: `sph`,
            x: position4.x,
            y: position4.y,
            z: position4.z,
            r: position4.r * 0.95,
            camOnly: true,
            canopy: true,
          });
        }
      }
      return;
    }
    if (Array.isArray(vegetation2?.trees)) {
      for (let position5 of vegetation2.trees) {
        if (
          !position5 ||
          Math.abs(position5.x - x) > result ||
          Math.abs(position5.z - z) > result
        ) {
          continue;
        }
        let result6 = Number.isFinite(position5.y)
          ? position5.y
          : this.groundBelow(position5.x, 60, position5.z);
        let result7 = position5.height ?? position5.h ?? 5.5;
        let result8 = position5.canopyRadius ?? 2.4;
        let stringResult = String(position5.type ?? ``);
        if (/pine/i.test(stringResult)) {
          camOccluders2.push({
            kind: `cyl`,
            x: position5.x,
            z: position5.z,
            r: result8 * 0.72,
            y0: result6 + 1.1,
            y1: result6 + result7 * 0.5,
            camOnly: true,
            canopy: true,
          });
          camOccluders2.push({
            kind: `cyl`,
            x: position5.x,
            z: position5.z,
            r: result8 * 0.42,
            y0: result6 + result7 * 0.5,
            y1: result6 + result7 * 0.92,
            camOnly: true,
            canopy: true,
          });
        } else if (/palm/i.test(stringResult)) {
          camOccluders2.push({
            kind: `cyl`,
            x: position5.x,
            z: position5.z,
            r: result8 * 0.75,
            y0: result6 + result7 - 1,
            y1: result6 + result7 + 0.3,
            camOnly: true,
            canopy: true,
          });
        } else {
          let result9 = result8 * 0.86;
          camOccluders2.push({
            kind: `sph`,
            x: position5.x,
            y: result6 + result7 - result9 * 0.95,
            z: position5.z,
            r: result9,
            camOnly: true,
            canopy: true,
          });
        }
      }
    }
  }
}
