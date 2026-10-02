/** Wall shading, ivy, trailing vines, flower rosettes, cottage windows and gabled roof details. */
import { propsState } from "../state.js";
export function preparePropsBuildingDetails() {
  propsState.buildingFullTurn = Math.PI * 2;
  propsState.ivyLeafGeometryCache = null;
  propsState.ivyLeafPalette = [
    propsState.propPalette.leaf,
    propsState.propPalette.leafDark,
    5214012,
    7910485,
  ];
}
