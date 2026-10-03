import { P, box } from "../shared/geometry.js";
import { slats } from "./slats.js";
import { lush } from "./planting.js";

export function planterSeat(b, r) {
  slats(b, 2.35, 0.66);
  for (let x of [-1.62, 1.62]) {
    box(b, "wood", 0.85, 0.68, 0.85, x, 0.34, 0, P.woodWarm);
    box(b, "paint", 0.92, 0.1, 0.92, x, 0.72, 0, 0x779c81);
    for (let z of [-0.46, 0.46])
      for (let y of [0.17, 0.48]) box(b, "wood", 0.89, 0.09, 0.05, x, y, z, P.woodDark);
    box(b, "soil", 0.72, 0.04, 0.72, x, 0.72, 0, P.soilTint);
    lush(b, r, x, 0.76, 0, 0.42);
    for (let z of [-0.4, 0.4]) box(b, "wood", 0.09, 0.66, 0.09, x - 0.35, 0.35, z, P.timber);
  }
  for (let yy of [1.01, 1.24]) box(b, "wood", 2.4, 0.16, 0.1, 0, yy, -0.38, P.woodWarm);
  for (let x of [-0.97, 0.97]) box(b, "wood", 0.1, 0.77, 0.1, x, 1.06, -0.37, P.timber);
}
