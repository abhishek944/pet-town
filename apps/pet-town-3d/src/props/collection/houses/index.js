import { prepareCollectionPalette, PropRandom } from "../shared/geometry.js";
import { windmill } from "./windmill.js";
import { bakery } from "./bakery.js";
import { boatHome } from "./boatHome.js";
import { glassHome } from "./glassHome.js";
import { treeLibrary } from "./treeLibrary.js";
import { gardenHouse } from "./garden-homes.js";
import { organic } from "./organic-homes.js";
import { bespokeMetadata, organicMetadata } from "./metadata.js";

const bespoke = new Map([
  ["windmill-neighbour", windmill],
  ["corner-bakery", bakery],
  ["boat-roof-home", boatHome],
  ["glass-garden-home", glassHome],
  ["woodland-library", treeLibrary],
]);
const garden = ["flower-garden-cottage", "conservatory-home", "gardenkeeper-cottage"];
const woodland = ["mushroom-home", "stone-tower", "stump-home"];

/** Append the approved construction into the caller's existing local builder. */
export function appendCollectionHouse(builder, random, assetId) {
  prepareCollectionPalette();
  const append = bespoke.get(assetId);
  if (append) {
    const details = append(builder, new PropRandom(71));
    return bespokeMetadata(assetId, details);
  }
  const gardenIndex = garden.indexOf(assetId);
  if (gardenIndex >= 0) return gardenHouse(builder, new PropRandom(14), gardenIndex);
  const woodlandIndex = woodland.indexOf(assetId);
  if (woodlandIndex >= 0) {
    organic(builder, new PropRandom(14), woodlandIndex);
    return organicMetadata(woodlandIndex);
  }
  return null;
}
