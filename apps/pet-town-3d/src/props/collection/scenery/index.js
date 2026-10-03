import { prepareCollectionPalette, PropRandom } from "../shared/geometry.js";
import { appendRoseGate } from "./rose-gate.js";
import { appendFlowerCart } from "./florist-cart.js";
import { appendAcornMailbox } from "./acorn-mailbox.js";
import { appendPicnic } from "./picnic-pavilion.js";
import { appendFountain } from "./lily-fountain.js";
import {
  roseGateMetadata,
  floristCartMetadata,
  acornMailboxMetadata,
  picnicPavilionMetadata,
  lilyFountainMetadata,
} from "./metadata.js";

const scenery = new Map([
  ["rose-gate", [appendRoseGate, roseGateMetadata]],
  ["florist-cart", [appendFlowerCart, floristCartMetadata]],
  ["acorn-mailbox", [appendAcornMailbox, acornMailboxMetadata]],
  ["picnic-pavilion", [appendPicnic, picnicPavilionMetadata]],
  ["lily-fountain", [appendFountain, lilyFountainMetadata]],
]);

export function appendCollectionScenery(builder, random, assetId) {
  const model = scenery.get(assetId);
  if (!model) throw new RangeError(`Unknown collection scenery: ${assetId}`);
  prepareCollectionPalette();
  // Keep the approved seed independent of the caller's placement/random order.
  model[0](builder, new PropRandom(51));
  return model[1]();
}
