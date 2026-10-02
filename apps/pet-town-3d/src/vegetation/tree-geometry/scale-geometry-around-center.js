/** Tree palettes, trunks, broadleaf crowns, fruit, pine tiers and palm fronds. */
export function scaleGeometryAroundCenter(cloneValue, position2, value) {
  let copy = cloneValue.clone();
  let position3 = copy.attributes.position;
  for (let index = 0; index < position3.count; index++) {
    position3.setXYZ(
      index,
      position2.x + (position3.getX(index) - position2.x) * value,
      position2.y + (position3.getY(index) - position2.y) * value,
      position2.z + (position3.getZ(index) - position2.z) * value,
    );
  }
  return copy;
}
