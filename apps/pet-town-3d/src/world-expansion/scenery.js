/** Fixed Sunmeadow composition. Coordinates are authored, never distributed at random. */
import { getCottagePlacementAccess } from "../props/terrain-placement/get-cottage-placement-access.js";

const HALF_TURN = Math.PI;
const QUARTER_TURN = Math.PI / 2;

function site(type, x, z, r, rot = 0, name, opts) {
  return { type, x, z, r, rot, name, opts };
}

// Keep the arrival trail, picnic clearing, campsite and lookout approaches open.
export const SUNMEADOW_SCENERY = [
  site("cottage", 83, -23, 5.2, 0, "Sunflower cottage", { variant: "cabin" }),
  site("garden", 76, -29, 4.4, 0, "Sunflower kitchen garden"),
  site("washingLine", 90, -26, 1.9, QUARTER_TURN),
  site("mailbox", 78, -19, 0.4, 0, "Sunflower post"),
  site("barrel", 88, -20, 0.7),
  site("cottage", 94, 4, 5.2, HALF_TURN, "Seabreeze cottage"),
  site("garden", 104, 5, 4.4, HALF_TURN, "Seabreeze garden"),
  site("bench", 103, 12, 1, QUARTER_TURN, "Seabreeze reading bench"),
  site("mailbox", 88, 4, 0.4),
  site("stall", 83, 23, 2.6, HALF_TURN, "Picnic fruit stand"),
  site("garden", 70, 25, 4.4, HALF_TURN, "Picnic sunflower garden"),
  site("bench", 72, 17, 1, QUARTER_TURN, "Picnic garden bench"),
  site("bench", 76, 20, 1, HALF_TURN, "Picnic circle bench"),
  site("logSeat", 80, 16, 0.9, QUARTER_TURN, "Picnic log seat"),
  site("crateStack", 86.5, 24, 0.8),
  site("barrel", 79.5, 24, 0.7),
  site("campfire", 68, -25, 1.1, 0, "Firefly campfire"),
  site("logSeat", 68, -28, 0.9, 0, "Firefly south log"),
  site("bench", 71, -25, 1, -QUARTER_TURN, "Firefly camp bench"),
  site("logSeat", 65, -25, 0.9, QUARTER_TURN, "Firefly west log"),
  site("crateStack", 66, -30, 0.8, 0.2),
  site("bench", 102, -18, 1, HALF_TURN, "Sunrise lookout bench"),
  site("bench", 105, -15, 1, QUARTER_TURN, "Ocean lookout bench"),
  site("bench", 104, 25, 1, QUARTER_TURN, "Shellshore bench"),
  site("logSeat", 98, 28, 0.9, 0, "Shellshore driftwood seat"),
  site("rocks", 108, 23, 1.2),
  site("rocks", 113, 19, 1.2, 0.9),
  site("rocks", 110, -22, 1.2),
  site("rocks", 95, -29, 1.2, 1.3),
  site("signpost", 55, 3, 0.4, 0, "Welcome to Sunmeadow"),
  site("signpost", 58, -13, 0.4, 0, "Firefly camp trail"),
  site("signpost", 81, -5, 0.4, 0, "Sunmeadow crossroads"),
  site("signpost", 73, 12, 0.4, 0, "Picnic garden trail"),
  site("signpost", 94, 21, 0.4, 0, "Shellshore trail"),
  site("lamp", 44, -5, 0.4),
  site("lamp", 57, 4, 0.4),
  site("lamp", 69, 7, 0.4),
  site("lamp", 82, 3, 0.4),
  site("lamp", 89, -5, 0.4),
  site("lamp", 99, -18, 0.4),
  site("lamp", 73, 20, 0.4),
  site("lamp", 83, 18, 0.4),
  site("lamp", 98, 24, 0.4),
  site("lamp", 66, -18, 0.4),
  site("lamp", 64, -28, 0.4),
];

const TRAIL_STONES = [
  [37, -2],
  [41, -2],
  [45, -2],
  [49, -1],
  [53, 0],
  [57, 1],
  [61, 2],
  [65, 3],
  [69, 4],
  [73, 2],
  [77, 0],
  [82, -3],
  [86, -6],
  [90, -9],
  [94, -12],
  [98, -14],
  [101, -15],
  [78, 5],
  [77, 10],
  [76, 14],
  [84, 9],
  [89, 12],
  [93, 16],
  [97, 20],
  [101, 23],
  [60, -5],
  [62, -10],
  [63, -15],
  [65, -20],
  [78, -7],
  [78, -12],
  [81, -17],
];

function footprintFor(terrain, placement) {
  const [hw, hd] =
    placement.type === "cottage"
      ? [4.1, 4.5]
      : placement.type === "garden"
        ? [3.8, 2.9]
        : placement.type === "stall"
          ? [2.4, 1.6]
          : [placement.r, placement.r];
  return terrain.footprint(placement.x, placement.z, hw, hd, placement.rot || 0, 0.5);
}

export function appendSunmeadowScenery(village) {
  if (village.terrain.size < 256) return;
  for (const authored of SUNMEADOW_SCENERY) {
    const placement = { rot: 0, ...authored, opts: { ...authored.opts } };
    const stats = footprintFor(village.terrain, placement);
    // Ground edits may flood a location; never reseat an authored building in water.
    if (stats.wet > 0 || !Number.isFinite(stats.max)) continue;
    Object.assign(placement, {
      y: stats.max,
      stats,
      found: Math.max(0.3, stats.max - stats.min + 0.35),
    });
    village.items.push(placement);
    village.occupied.push({ x: placement.x, z: placement.z, r: placement.r, type: placement.type });
    if (placement.type === "cottage") {
      const access = getCottagePlacementAccess(village.terrain, placement);
      Object.assign(placement, { frontGround: access.frontGround, front: access.front });
      village.entrances.push(access.front);
      village.occupied.push({
        x: access.porch[0],
        z: access.porch[1],
        r: access.porchR,
        type: "porch",
      });
    }
  }
  for (const [x, z] of TRAIL_STONES) {
    if (!village.terrain.isWater(x, z)) village.stones.push({ x, z });
  }
}
