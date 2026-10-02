export function playerWorldParse(collider, isTree, x, z, radius) {
  if (!collider || typeof collider != `object`) {
    return null;
  }
  try {
    if (
      typeof collider.x1 == `number` &&
      typeof collider.z1 == `number` &&
      typeof collider.x2 == `number` &&
      typeof collider.z2 == `number`
    ) {
      let result10 = collider.r ?? collider.radius ?? 0.15;
      if (
        Math.min(collider.x1, collider.x2) - result10 > x + radius ||
        Math.max(collider.x1, collider.x2) + result10 < x - radius ||
        Math.min(collider.z1, collider.z2) - result10 > z + radius ||
        Math.max(collider.z1, collider.z2) + result10 < z - radius
      ) {
        return null;
      }
      let result11 = collider.y0 ?? collider.y;
      if (!Number.isFinite(result11)) {
        result11 = this.groundBelow(
          (collider.x1 + collider.x2) / 2,
          60,
          (collider.z1 + collider.z2) / 2,
        );
      }
      return {
        kind: `seg`,
        x1: collider.x1,
        z1: collider.z1,
        x2: collider.x2,
        z2: collider.z2,
        r: result10,
        y0: result11,
        y1: collider.y1 ?? result11 + (collider.h ?? 1.2),
        noTop: collider.noTop !== false,
      };
    }
    let result = collider.isBox3
      ? collider
      : collider.box && (collider.box.isBox3 || collider.box.min)
        ? collider.box
        : collider.min && collider.max && typeof collider.min.x == `number`
          ? collider
          : null;
    if (result) {
      return result.max.x < x - radius ||
        result.min.x > x + radius ||
        result.max.z < z - radius ||
        result.min.z > z + radius
        ? null
        : {
            kind: `box`,
            minX: result.min.x,
            minY: result.min.y,
            minZ: result.min.z,
            maxX: result.max.x,
            maxY: result.max.y,
            maxZ: result.max.z,
          };
    }
    if (collider.center && (collider.size || collider.half || collider.halfSize)) {
      let position2 = collider.half ??
        collider.halfSize ?? {
          x: collider.size.x / 2,
          y: collider.size.y / 2,
          z: collider.size.z / 2,
        };
      let center2 = collider.center;
      return Math.abs(center2.x - x) > radius + position2.x ||
        Math.abs(center2.z - z) > radius + position2.z
        ? null
        : {
            kind: `box`,
            minX: center2.x - position2.x,
            minY: center2.y - position2.y,
            minZ: center2.z - position2.z,
            maxX: center2.x + position2.x,
            maxY: center2.y + position2.y,
            maxZ: center2.z + position2.z,
          };
    }
    let result2;
    let result3;
    let result4;
    let result5 = 1;
    if (collider.isObject3D) {
      let elements2 = collider.matrixWorld?.elements;
      if (elements2 && (elements2[12] || elements2[14])) {
        result2 = elements2[12];
        result3 = elements2[13];
        result4 = elements2[14];
      } else {
        result2 = collider.position.x;
        result3 = collider.position.y;
        result4 = collider.position.z;
      }
      result5 = collider.scale?.x ?? 1;
      let result12 = collider.userData ?? {};
      if (result12.collider === false) {
        return null;
      }
      collider = {
        ...result12,
        ...(typeof result12.collider == `object` ? result12.collider : {}),
      };
    } else {
      let position3 = collider.position ?? collider.pos ?? collider.p ?? collider;
      result2 = position3.x;
      result3 = position3.y;
      result4 = position3.z;
    }
    if (typeof result2 != `number` || typeof result4 != `number`) {
      return null;
    }
    let result6 = !!(collider.noTop || collider.walkable === false || collider.top === false);
    if ((typeof collider.w == `number` && collider.w > 0) || typeof collider.hx == `number`) {
      let result13 = collider.hx ?? collider.w / 2;
      let result14 = collider.hz ?? (collider.d ?? collider.w) / 2;
      if (Math.abs(result2 - x) > radius + result13 || Math.abs(result4 - z) > radius + result14) {
        return null;
      }
      let result15 = collider.y0 ?? result3;
      if (!Number.isFinite(result15)) {
        result15 = this.groundBelow(result2, 60, result4);
      }
      let result16 = collider.y1 ?? result15 + (collider.h ?? collider.height ?? 1.5);
      return {
        kind: `box`,
        minX: result2 - result13,
        minY: result15,
        minZ: result4 - result14,
        maxX: result2 + result13,
        maxY: result16,
        maxZ: result4 + result14,
        noTop: result6,
      };
    }
    if (Math.abs(result2 - x) > radius || Math.abs(result4 - z) > radius) {
      return null;
    }
    let result7 =
      (collider.r ??
        collider.radius ??
        collider.trunkRadius ??
        collider.trunkR ??
        (isTree ? 0.32 : 0.45)) * (collider.r == null && collider.radius == null ? result5 : 1);
    let result8 = collider.y0 ?? collider.base ?? collider.bottom ?? result3;
    if (typeof result8 != `number` || !isFinite(result8)) {
      result8 = this.groundBelow(result2, 60, result4);
    }
    let result9 =
      collider.y1 ??
      collider.top ??
      result8 +
        (collider.h ?? collider.height ?? collider.trunkHeight ?? (isTree ? 3.2 * result5 : 1.6));
    return {
      kind: `cyl`,
      x: result2,
      z: result4,
      r: result7,
      y0: result8,
      y1: result9,
      noTop:
        result6 ||
        (isTree && collider.walkable !== true && collider.kind !== `log`) ||
        (!isTree && result9 - result8 > 2.2 && result7 < 1.2),
    };
  } catch {
    return null;
  }
}
