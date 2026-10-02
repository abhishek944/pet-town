/** Terrain access, solid-block queries and raycast normalization with voxel-grid fallback. */
import { coerceRaycastPosition } from "./coerce-raycast-position.js";
import { coerceRaycastNumber } from "./coerce-raycast-number.js";
import { resolveTerrainBlockId } from "./resolve-terrain-block-id.js";
import { readTerrainBlock } from "./read-terrain-block.js";
export function normalizeTerrainRaycastHit(hit, origin, direction) {
  if (!hit || typeof hit != `object`) {
    return null;
  }
  if (Array.isArray(hit)) {
    hit = {
      x: hit[0],
      y: hit[1],
      z: hit[2],
    };
  }
  let position4 =
    coerceRaycastPosition(hit.block) ??
    coerceRaycastPosition(hit.cell) ??
    coerceRaycastPosition(hit.voxel) ??
    coerceRaycastPosition(hit.blockPos) ??
    (Number.isInteger(coerceRaycastNumber(hit.x)) &&
    Number.isInteger(coerceRaycastNumber(hit.y)) &&
    Number.isInteger(coerceRaycastNumber(hit.z))
      ? hit
      : null);
  let position5 =
    coerceRaycastPosition(hit.point) ??
    coerceRaycastPosition(hit.hitPoint) ??
    coerceRaycastPosition(hit.position) ??
    (position4 ? null : coerceRaycastPosition(hit));
  let position6 =
    coerceRaycastPosition(hit.normal) ??
    coerceRaycastPosition(hit.faceNormal) ??
    coerceRaycastPosition(hit.face) ??
    coerceRaycastPosition(hit.n);
  let position7 =
    coerceRaycastPosition(hit.place) ??
    coerceRaycastPosition(hit.prev) ??
    coerceRaycastPosition(hit.previous) ??
    coerceRaycastPosition(hit.adjacent) ??
    coerceRaycastPosition(hit.before);
  let result;
  let result2;
  let result3;
  if (
    (position4 &&
      [position4.x, position4.y, position4.z].every((value2) =>
        Number.isFinite(coerceRaycastNumber(value2)),
      ) &&
      ((result = Math.floor(coerceRaycastNumber(position4.x))),
      (result2 = Math.floor(coerceRaycastNumber(position4.y))),
      (result3 = Math.floor(coerceRaycastNumber(position4.z)))),
    !position6 &&
      position7 &&
      result != null &&
      (position6 = {
        x: position7.x - result,
        y: position7.y - result2,
        z: position7.z - result3,
      }),
    !position6 && position5)
  ) {
    let callback = (value3) => Math.abs(position5[value3] - Math.round(position5[value3]));
    let result7 = [`x`, `y`, `z`].sort((value4, value5) => callback(value4) - callback(value5))[0];
    position6 = {
      x: 0,
      y: 0,
      z: 0,
    };
    position6[result7] = -Math.sign(direction[result7]) || 1;
  }
  if (
    (result == null &&
      position5 &&
      ((result = Math.floor(position5.x - position6.x * 0.01)),
      (result2 = Math.floor(position5.y - position6.y * 0.01)),
      (result3 = Math.floor(position5.z - position6.z * 0.01))),
    result == null || !Number.isFinite(result))
  ) {
    return null;
  }
  if (!position6) {
    let values = [Math.abs(direction.x), Math.abs(direction.y), Math.abs(direction.z)];
    let indexOfResult = values.indexOf(Math.max(...values));
    position6 = {
      x: 0,
      y: 0,
      z: 0,
    };
    position6[`xyz`[indexOfResult]] = -Math.sign(direction[`xyz`[indexOfResult]]);
  }
  let result4 = Math.round(coerceRaycastNumber(position6.x)) || 0;
  let result5 = Math.round(coerceRaycastNumber(position6.y)) || 0;
  let result6 = Math.round(coerceRaycastNumber(position6.z)) || 0;
  return {
    x: result,
    y: result2,
    z: result3,
    nx: result4,
    ny: result5,
    nz: result6,
    dist: coerceRaycastNumber(hit.distance ?? hit.dist ?? hit.t),
    id:
      resolveTerrainBlockId(hit.block?.id ?? hit.id ?? hit.blockId) ||
      readTerrainBlock(result, result2, result3),
  };
}
