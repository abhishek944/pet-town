/** Wall shading, ivy, trailing vines, flower rosettes, cottage windows and gabled roof details. */
import * as THREE from "three";
import { propsState } from "../state.js";
export function createIvyLeafGeometry() {
  if (!propsState.ivyLeafGeometryCache) {
    let shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.bezierCurveTo(0.09, 0.02, 0.12, 0.1, 0.07, 0.15);
    shape.bezierCurveTo(0.04, 0.17, 0.01, 0.15, 0, 0.2);
    shape.bezierCurveTo(-0.01, 0.15, -0.04, 0.17, -0.07, 0.15);
    shape.bezierCurveTo(-0.12, 0.1, -0.09, 0.02, 0, 0);
    propsState.ivyLeafGeometryCache = new THREE.ShapeGeometry(shape, 4);
    let position2 = propsState.ivyLeafGeometryCache.attributes.position;
    for (let index = 0; index < position2.count; index++) {
      let xResult = position2.getX(index);
      let yResult = position2.getY(index);
      position2.setZ(index, -Math.abs(xResult) * 0.5 + yResult * 0.12);
    }
    propsState.ivyLeafGeometryCache.computeVertexNormals();
  }
  return propsState.ivyLeafGeometryCache.clone();
}
