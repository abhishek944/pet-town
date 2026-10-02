/** Detailed market stall geometry and decorative flat leaf geometry. */
import { propsState } from "../state.js";
import { createIvyLeafGeometry } from "../building-details/create-ivy-leaf-geometry.js";
export function createFlatLeafGeometry() {
  if (!propsState.flatLeafGeometryCache) {
    propsState.flatLeafGeometryCache = createIvyLeafGeometry();
    propsState.flatLeafGeometryCache.scale(1, 1, 0);
  }
  return propsState.flatLeafGeometryCache.clone();
}
