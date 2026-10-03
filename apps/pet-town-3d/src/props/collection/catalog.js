/** Stable approved identities. Footprints include decorative overhangs and approach clearance. */
const definitions = [
  ["windmill-neighbour", "Windmill neighbour", "Buildings", 71, 4.6, 4.4],
  ["corner-bakery", "Corner bakery", "Buildings", 71, 4.6, 4.5],
  ["boat-roof-home", "Boat-roof home", "Buildings", 71, 4.8, 4.8],
  ["glass-garden-home", "Glass garden home", "Buildings", 71, 4.1, 4.2],
  ["woodland-library", "Woodland library", "Buildings", 71, 4.3, 4.3],
  ["flower-garden-cottage", "Flower garden cottage", "Buildings", 14, 4.8, 5.5],
  ["conservatory-home", "Home with conservatory", "Buildings", 14, 6.2, 5.2],
  ["gardenkeeper-cottage", "Gardenkeeper cottage", "Buildings", 14, 4.8, 5.5],
  ["mushroom-home", "Mushroom home", "Buildings", 14, 4.1, 4.4],
  ["stone-tower", "Round stone tower", "Buildings", 14, 3.7, 4.4],
  ["stump-home", "Hollow-stump home", "Buildings", 14, 3.7, 4.4],
  ["fern-scroll-bench", "Fern-scroll park bench", "Seating", 31, 1.55, 0.7],
  ["flower-box-bench", "Flower-box bench", "Seating", 31, 2.2, 0.75],
  ["reading-seat", "Quiet reading seat", "Seating", 31, 1.8, 1.05],
  ["tree-circle-bench", "Tree-circle bench", "Seating", 31, 2.2, 2.2],
  ["pergola-swing", "Vine-covered swing", "Seating", 31, 2.25, 1.1],
  ["twin-lantern", "Twin lantern street light", "Lights", 42, 1.2, 0.45],
  ["flower-lantern", "Cottage flower lantern", "Lights", 42, 1, 0.65],
  ["celestial-globe", "Celestial globe light", "Lights", 42, 0.95, 0.5],
  ["mushroom-lantern", "Mushroom path lantern", "Lights", 42, 0.8, 0.8],
  ["lily-bell-lamp", "Lily-bell garden lamp", "Lights", 42, 1.2, 0.7],
  ["rose-gate", "Rose arch garden gate", "Scenery", 51, 2.55, 0.95],
  ["florist-cart", "Travelling florist’s cart", "Scenery", 51, 1.9, 1.7],
  ["acorn-mailbox", "Acorn woodland mailbox", "Scenery", 51, 1.1, 0.9],
  ["picnic-pavilion", "Blue-roof picnic pavilion", "Scenery", 51, 2.5, 2],
  ["lily-fountain", "Water-lily garden fountain", "Scenery", 51, 1.85, 1.85],
];
export const WORLD_ASSETS = definitions.map(([id, name, category, seed, hw, hd]) =>
  Object.freeze({ id, name, category, seed, hw, hd, radius: Math.hypot(hw, hd) }),
);
const byId = new Map(WORLD_ASSETS.map((asset) => [asset.id, asset]));
export function getWorldAsset(id) {
  return byId.get(id) ?? null;
}
