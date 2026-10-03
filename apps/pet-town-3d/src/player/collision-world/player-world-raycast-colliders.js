import { raycastPlayerFenceSegment } from "./raycast-player-fence-segment.js";

export function playerWorldRaycastColliders(x, y, z, dx, dy, dz, maxDistance) {
  let value7Value = maxDistance;
  if (Math.hypot(dx, dz) < 1e-6) {
    return value7Value;
  }
  let result = this.camOccluders.length ? this.colliders.concat(this.camOccluders) : this.colliders;
  for (let position of result) {
    if (position.kind === `seg`) {
      value7Value = Math.min(
        value7Value,
        raycastPlayerFenceSegment(position, x, y, z, dx, dy, dz, value7Value),
      );
      continue;
    }
    if (position.kind === `sph`) {
      let result12 = x - position.x;
      let result13 = y - position.y;
      let result14 = z - position.z;
      let result15 = result12 * dx + result13 * dy + result14 * dz;
      let result16 =
        result12 * result12 + result13 * result13 + result14 * result14 - position.r * position.r;
      if (result16 < 0) {
        continue;
      }
      let result17 = result15 * result15 - result16;
      if (result17 < 0) {
        continue;
      }
      let result18 = -result15 - Math.sqrt(result17);
      if (result18 > 0 && result18 < value7Value) {
        value7Value = result18;
      }
      continue;
    }
    if (position.kind === `box`) {
      if (position.cam === false) {
        continue;
      }
      let index = 0;
      let value7ValueValue = value7Value;
      for (let [result19, result20, result21, result22] of [
        [x, dx, position.minX, position.maxX],
        [y, dy, position.minY, position.maxY],
        [z, dz, position.minZ, position.maxZ],
      ]) {
        if (Math.abs(result20) < 1e-9) {
          if (result19 < result21 || result19 > result22) {
            index = 1 / 0;
            break;
          }
          continue;
        }
        let result23 = (result21 - result19) / result20;
        let result24 = (result22 - result19) / result20;
        if (result23 > result24) {
          let result23Value = result23;
          result23 = result24;
          result24 = result23Value;
        }
        if (
          (result23 > index && (index = result23),
          result24 < value7ValueValue && (value7ValueValue = result24),
          index > value7ValueValue)
        ) {
          break;
        }
      }
      if (index <= value7ValueValue && index > 0 && index < value7Value) {
        value7Value = index;
      }
      continue;
    }
    if (position.kind !== `cyl` || (position.r < this.camMinR && !position.camOnly)) {
      continue;
    }
    let result2 = x - position.x;
    let result3 = z - position.z;
    let result4 = dx * dx + dz * dz;
    let result5 = 2 * (result2 * dx + result3 * dz);
    let result6 = result2 * result2 + result3 * result3 - position.r * position.r;
    if (result6 < 0) {
      if (position.camOnly && y < position.y0 && dy > 1e-4) {
        let result25 = (position.y0 - y) / dy;
        if (result25 > 0 && result25 < value7Value) {
          value7Value = result25;
        }
      }
      continue;
    }
    let result7 = result5 * result5 - 4 * result4 * result6;
    if (result7 < 0) {
      continue;
    }
    let result8 = Math.sqrt(result7);
    let result9 = (-result5 - result8) / (2 * result4);
    let result10 = (-result5 + result8) / (2 * result4);
    if (Math.abs(dy) > 1e-6) {
      let result26 = (position.y0 - y) / dy;
      let result27 = (position.y1 - y) / dy;
      if (result26 > result27) {
        let result26Value = result26;
        result26 = result27;
        result27 = result26Value;
      }
      result9 = Math.max(result9, result26);
      result10 = Math.min(result10, result27);
    } else if (y < position.y0 || y > position.y1) {
      continue;
    }
    if (result9 > result10 || result10 < 0) {
      continue;
    }
    let result11 = Math.max(0, result9);
    if (result11 < value7Value) {
      value7Value = result11;
    }
  }
  return value7Value;
}
