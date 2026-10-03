import { createCreatureEllipsoidGeometry } from "../../geometry/create-creature-ellipsoid-geometry.js";
import { colorCreatureGeometryVertices } from "../../geometry/color-creature-geometry-vertices.js";
import { getCreatureColor } from "../../geometry/get-creature-color.js";

/** Cream heart plumage blended into the head itself, with no rigid mask edge. */
export function createBirdFacialDisc(back, face) {
  const geometry = createCreatureEllipsoidGeometry(0.315, 0.285, 0.26, 64, 48);
  colorCreatureGeometryVertices(geometry, (color, position) => {
    const x = position.x / 0.26;
    const y = (position.y + 0.025) / 0.215;
    const heart = (x * x + y * y - 1) ** 3 - x * x * y ** 3;
    const edge = Math.max(0, Math.min(1, (0.035 - heart) / 0.07));
    const front = Math.max(0, Math.min(1, position.z / 0.05));
    const blend = edge * edge * (3 - 2 * edge) * front;
    color.copy(getCreatureColor(back)).lerp(getCreatureColor(face), blend);
  });
  return geometry;
}
