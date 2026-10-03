/** Fixed coastal camp, quiet sandy coves and sea-bluff composition. */
import { EXPANSION_STAGE } from "./layout.js";
import { getCottagePlacementAccess } from "../props/terrain-placement/get-cottage-placement-access.js";

const PI = Math.PI;
const QUARTER_TURN = PI / 2;

function site(type, x, z, r, rot = 0, name, opts) {
  return { type, x, z, r, rot, name, opts };
}

export const SHELLHAVEN_SCENERY = [
  site("cottage", -61, 64, 5.2, 0, "Driftwood cabin", { variant: "cabin" }),
  site("stall", -50, 66, 2.6, 0, "Seaside picnic market"),
  site("washingLine", -69, 66, 1.9, QUARTER_TURN, "Sea-breeze washing line"),
  site("mailbox", -56, 68, 0.4, 0, "Driftwood post"),
  site("barrel", -55, 64, 0.7, 0, "Driftwood rain barrel"),
  site("crateStack", -55, 60, 0.8, 0.2, "Seaside provisions"),
  site("campfire", -65, 77, 1.1, 0, "Driftwood evening fire"),
  site("bench", -65, 80, 1, PI, "Driftwood fireside bench"),
  site("logSeat", -68, 77, 0.9, QUARTER_TURN, "Driftwood west log"),
  site("logSeat", -62, 78, 0.9, QUARTER_TURN, "Driftwood east log"),
  site("bench", -69, 84, 1, PI, "Quiet inlet bench"),
  site("bench", -10, 83, 1, QUARTER_TURN, "Shell Cove reading bench"),
  site("bench", -21, 84, 1, PI, "Shell Cove shaded bench"),
  site("logSeat", -4, 95, 0.9, 0, "Sandbank driftwood seat"),
  site("logSeat", -22, 101, 0.9, 0, "Southern beach driftwood"),
  site("logSeat", 0, 105, 0.9, 0, "Open sea driftwood"),
  site("bench", 6, 104, 1, 0, "Shellhaven sunset bench"),
  site("bench", -47, 97, 1, QUARTER_TURN, "Tidepool watching bench"),
  site("bench", -34, 103, 1, PI, "Tidepool southern bench"),
  site("bench", 22, 90, 1, QUARTER_TURN, "Seabreeze ocean lookout"),
  site("bench", 19, 85, 1, PI, "Seabreeze island lookout"),
  site("logSeat", 12, 90, 0.9, 0, "Seabreeze bluff log"),
  site("bench", 10, 56, 1, 0, "Shellhaven arrival bench"),
  site("rocks", -47, 99, 1.4, 0, "Tidepool west stones", { r: 0.65, n: 3 }),
  site("rocks", -30, 98, 1.4, 0.7, "Tidepool east stones", { r: 0.65, n: 3 }),
  site("rocks", -42, 103, 1.4, 0.2, "Tidepool south stones", { r: 0.65, n: 3 }),
  site("rocks", 27, 82, 1.4, 0, "Seabreeze fern stones", { r: 0.65, n: 3 }),
  site("rocks", 21, 80, 1.4, 0.8, "Seabreeze shore stones", { r: 0.65, n: 3 }),
  site("rocks", 31, 90, 1.4, 0.3, "Seabreeze eastern stones", { r: 0.65, n: 3 }),
  site("rocks", -2, 91, 1.4, 0.5, "Quiet beach stones", { r: 0.65, n: 3 }),
  site("rocks", -25, 103, 1.4, 0.1, "Southern beach stones", { r: 0.65, n: 3 }),
  site("lamp", 2, 54, 0.4, 0, "Shellhaven gate lantern"),
  site("lamp", -10, 86, 0.4, 0, "Shell Cove lantern"),
  site("lamp", -20, 89, 0.4, 0, "Beach walk lantern"),
  site("lamp", 9, 87, 0.4, 0, "Bluff trail lantern"),
  site("lamp", -69, 73, 0.4, 0, "Driftwood camp lantern"),
  site("lamp", -46, 68, 0.4, 0, "Seaside market lantern"),
  site("lamp", -48, 89, 0.4, 0, "Tidepool trail lantern"),
  site("lamp", -34, 81, 0.4, 0, "Driftwood trail lantern"),
  site("signpost", 10, 61, 0.4, 0, "Welcome to Shellhaven"),
  site("signpost", -9, 80, 0.4, 0, "Shell Cove crossroads"),
  site("signpost", -35, 92, 0.4, 0, "Tidepool garden trail"),
  site("signpost", -56, 72, 0.4, 0, "Driftwood camp trail"),
  site("signpost", 21, 93, 0.4, 0, "Seabreeze bluff trail"),
];

const TRAIL_STONES = [
  [6, 51],
  [6, 55],
  [3, 59],
  [-1, 64],
  [-6, 69],
  [-11, 74],
  [-17, 78],
  [-22, 81],
  [-27, 84],
  [-32, 86],
  [-36, 89],
  [-39, 91],
  [-35, 84],
  [-40, 83],
  [-45, 82],
  [-50, 79],
  [-55, 76],
  [-60, 73],
  [-59, 79],
  [-58, 84],
  [-54, 89],
  [-49, 92],
  [-44, 91],
  [-11, 78],
  [-5, 78],
  [1, 79],
  [7, 81],
  [12, 83],
  [15, 87],
  [-16, 89],
  [-16, 94],
  [-11, 98],
  [-5, 102],
  [1, 100],
  [10, 98],
  [14, 96],
];

function sampleFootprint(terrain, placement) {
  const [hw, hd] =
    placement.type === "cottage"
      ? [4.1, 4.5]
      : placement.type === "stall"
        ? [2.4, 1.6]
        : [placement.r, placement.r];
  return terrain.footprint(placement.x, placement.z, hw, hd, placement.rot, 0.5);
}

export function appendShellhavenScenery(village) {
  const stage = village.context.terrain?.expansion?.stage ?? EXPANSION_STAGE;
  if (stage < 3 || village.terrain.size < 256) return;
  for (const authored of SHELLHAVEN_SCENERY) {
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
