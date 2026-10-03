import { P, box } from "../shared/geometry.js";

export function slats(b, w = 2.55, y = 0.61, z = 0, col = P.woodWarm) {
  for (let i = 0; i < 4; i++)
    box(b, "wood", w, 0.11, 0.17, 0, y, z - 0.28 + i * 0.19, col, { uv: { grain: 0 } });
}
