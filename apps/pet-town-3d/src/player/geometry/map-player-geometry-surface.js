/** Procedural ellipsoids, iris highlights, tubes, straps, decals, stitched patches and surface projection. */
export function mapPlayerGeometrySurface(attributesValue, value) {
  let position2 = attributesValue.attributes.position;
  for (let index = 0; index < position2.count; index++) {
    let valueResult = value(position2.getX(index), position2.getY(index));
    position2.setXYZ(index, valueResult.x, valueResult.y, valueResult.z);
  }
  attributesValue.computeVertexNormals();
  return attributesValue;
}
