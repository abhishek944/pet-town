import { createCreaturePetalGeometry } from "../../geometry/create-creature-petal-geometry.js";
import { colorCreatureGeometryVertices } from "../../geometry/color-creature-geometry-vertices.js";
import { getCreatureColor } from "../../geometry/get-creature-color.js";
import { orientCreatureGeometry } from "../../rig-builders/orient-creature-geometry.js";

/** Rounded, cupped feather with a soft shaft and a full volumetric silhouette. */
export function createBirdFeather(width, length, color, tip, origin, direction, roll = 0) {
  const geometry = createCreaturePetalGeometry(width, length, width * 0.26, {
    base: 0.32,
    tip: 0.32,
    bend: 0.045,
    cup: 0.07,
    thinTip: 0.5,
    ws: 10,
    hs: 12,
  });
  colorCreatureGeometryVertices(geometry, (result, position, normal, t) => {
    result.copy(getCreatureColor(color)).lerp(getCreatureColor(tip), t * t * 0.65);
    const shaft = Math.exp(-Math.abs(position.x / width) * 15) * 0.05;
    result.lerp(getCreatureColor(0xffffff), shaft + Math.max(0, normal.z) * 0.025);
  });
  return orientCreatureGeometry(geometry, direction, origin, roll);
}
