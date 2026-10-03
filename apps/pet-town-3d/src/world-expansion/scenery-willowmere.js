/** Fixed lakeside, woodland and ridge compositions, placed after existing districts. */
import { EXPANSION_STAGE } from "./layout.js";
import { getCottagePlacementAccess } from "../props/terrain-placement/get-cottage-placement-access.js";

const PI = Math.PI;
const QUARTER_TURN = PI / 2;

function site(type, x, z, r, rot = 0, name, opts) {
  return { type, x, z, r, rot, name, opts };
}

export const WILLOWMERE_SCENERY = [
  site("cottage", 17, -83, 5.2, 0, "Willowmere cabin", { variant: "cabin" }),
  site("garden", 25, -77, 4.4, 0, "Willowmere kitchen garden"),
  site("washingLine", 25, -86, 1.9, QUARTER_TURN),
  site("mailbox", 11, -75, 0.4, 0, "Willowmere post"),
  site("barrel", 21, -82, 0.7),
  site("crateStack", 22, -89, 0.8, 0.2),
  site("bench", 23, -70, 1, 0, "Willowmere garden bench"),
  site("bench", -24, -61, 1, PI, "Lake reading bench"),
  site("bench", 3, -83, 1, -QUARTER_TURN, "Quietwater reading bench"),
  site("bench", -18, -101, 1, 0, "Southern lake bench"),
  site("logSeat", -42, -81, 0.9, QUARTER_TURN, "Willowbank log seat"),
  site("bench", -7, -55, 1, -QUARTER_TURN, "Woodland gate bench"),
  site("stall", -50, -57, 2.6, 0, "Woodland picnic stand"),
  site("barrel", -54, -55, 0.7),
  site("crateStack", -47, -54, 0.8),
  site("campfire", -42, -59, 1.1, 0, "Lanternwood campfire"),
  site("logSeat", -42, -56, 0.9, 0, "Lanternwood log seat"),
  site("bench", -45, -59, 1, QUARTER_TURN, "Lanternwood camp bench"),
  site("logSeat", -39, -59, 0.9, QUARTER_TURN, "Lanternwood east log"),
  site("bench", -53, -64, 1, QUARTER_TURN, "Lantern grove reading bench"),
  site("bench", -62, -92, 1, QUARTER_TURN, "Fernridge lake lookout"),
  site("bench", -66, -88, 1, -QUARTER_TURN, "Fernridge ocean lookout"),
  site("rocks", -35, -80, 1.4, 0.3, undefined, { r: 0.65, n: 3 }),
  site("rocks", -20, -91.5, 1.4, 0, undefined, { r: 0.65, n: 3 }),
  site("rocks", 0, -88, 1.4, 0.7, undefined, { r: 0.65, n: 3 }),
  site("rocks", -65, -92, 1.4, 0, undefined, { r: 0.65, n: 3 }),
  site("rocks", -72, -86, 1.4, 1.1, undefined, { r: 0.65, n: 3 }),
  site("rocks", -56, -97, 1.4, 0.5, undefined, { r: 0.65, n: 3 }),
  site("signpost", -17, -50, 0.4, 0, "Welcome to Willowmere"),
  site("signpost", -25, -63, 0.4, 0, "Willowmere lake circuit"),
  site("signpost", -48, -62, 0.4, 0, "Lantern grove trail"),
  site("signpost", -58, -82, 0.4, 0, "Fernridge trail"),
  site("signpost", 5, -72, 0.4, 0, "Willowmere cabin trail"),
  site("lamp", -8, -47, 0.4),
  site("lamp", -20, -58, 0.4),
  site("lamp", -28, -62, 0.4),
  site("lamp", -4, -69, 0.4),
  site("lamp", 12, -73, 0.4),
  site("lamp", -49, -53, 0.4),
  site("lamp", -65, -90, 0.4),
];

const TRAIL_STONES = [
  [-12, -47],
  [-14, -56],
  [-16, -60],
  [-19, -65],
  [-25, -65],
  [-30, -64],
  [-36, -63],
  [-42, -65],
  [-47, -67],
  [-52, -69],
  [-57, -71],
  [-62, -74],
  [-67, -78],
  [-67, -82],
  [-63, -86],
  [-15, -65],
  [-9, -64],
  [-3, -63],
  [3, -67],
  [9, -74],
  [9, -78],
  [13, -77],
  [-11, -67],
  [-4, -72],
  [-2, -80],
  [-4, -88],
  [-11, -93],
  [-20, -95],
  [-29, -93],
  [-36, -88],
  [-38, -80],
  [-36, -72],
  [-29, -67],
];

function sampleFootprint(terrain, placement) {
  const [hw, hd] =
    placement.type === "cottage"
      ? [4.1, 4.5]
      : placement.type === "garden"
        ? [3.8, 2.9]
        : placement.type === "stall"
          ? [2.4, 1.6]
          : [placement.r, placement.r];
  return terrain.footprint(placement.x, placement.z, hw, hd, placement.rot, 0.5);
}

export function appendWillowmereScenery(village) {
  const stage = village.context.terrain?.expansion?.stage ?? EXPANSION_STAGE;
  if (stage < 2 || village.terrain.size < 256) return;
  for (const authored of WILLOWMERE_SCENERY) {
    const placement = { ...authored, opts: { ...authored.opts } };
    const stats = sampleFootprint(village.terrain, placement);
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
