/** Procedural ellipsoids, iris highlights, tubes, straps, decals, stitched patches and surface projection. */
import * as THREE from "three";
export function colorPlayerGeometryVertices(attributesValue, value) {
  let position2 = attributesValue.attributes.position;
  let normal2 = attributesValue.attributes.normal;
  let floatBuffer = new Float32Array(position2.count * 3);
  let vector = new THREE.Vector3();
  let vector2 = new THREE.Vector3();
  let color = new THREE.Color();
  for (let index = 0; index < position2.count; index++) {
    vector.fromBufferAttribute(position2, index);
    vector2.fromBufferAttribute(normal2, index);
    value(color, vector, vector2);
    floatBuffer[index * 3] = color.r;
    floatBuffer[index * 3 + 1] = color.g;
    floatBuffer[index * 3 + 2] = color.b;
  }
  attributesValue.setAttribute(`color`, new THREE.BufferAttribute(floatBuffer, 3));
  return attributesValue;
}
