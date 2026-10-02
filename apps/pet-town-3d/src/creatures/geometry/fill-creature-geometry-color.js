/** Reusable procedural creature geometry, vertex colors, ellipsoid projection and transforms. */
import { colorCreatureGeometryVertices } from "./color-creature-geometry-vertices.js";
import { getCreatureColor } from "./get-creature-color.js";
export let fillCreatureGeometryColor = (value, value2) =>
  colorCreatureGeometryVertices(value, (copyValue) => copyValue.copy(getCreatureColor(value2)));
