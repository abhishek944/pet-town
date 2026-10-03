import { supportedGround } from "../willowmere/support.js";
import { DISPLAY_SHELF } from "./places.js";

export const shellSupport = (context, shell) => supportedGround(context, shell, 0.55);

/** The complete shelf board and four legs need level, dry support. */
export function displaySupport(context) {
  const { x, z } = DISPLAY_SHELF;
  const height = supportedGround(context, DISPLAY_SHELF);
  if (height === null) return null;
  for (let cellZ = Math.floor(z - 0.65); cellZ <= Math.floor(z + 0.65); cellZ++) {
    for (let cellX = Math.floor(x - 1.65); cellX <= Math.floor(x + 1.65); cellX++) {
      const top = context.terrain.topY(cellX + 0.5, cellZ + 0.5);
      if (!Number.isFinite(top) || Math.abs(top - height) > 0.1) return null;
    }
  }
  return height;
}
