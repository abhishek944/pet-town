/** Creature bones, jointed legs, jiggle metadata, mesh orientation and extrusion helpers. */
import * as THREE from "three";
import { mergeVertices } from "three/addons/utils/BufferGeometryUtils.js";
export function createCreatureExtrudedShapeGeometry(value, value2) {
  let extrudeGeometry = new THREE.ExtrudeGeometry(value, value2);
  extrudeGeometry.deleteAttribute(`uv`);
  extrudeGeometry.deleteAttribute(`normal`);
  extrudeGeometry = mergeVertices(extrudeGeometry, 1e-4);
  extrudeGeometry.computeVertexNormals();
  return extrudeGeometry;
}
