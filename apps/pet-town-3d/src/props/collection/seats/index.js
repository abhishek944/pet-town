import { PropRandom, prepareCollectionPalette } from "../shared/geometry.js";
import { park } from "./park-bench.js";
import { planterSeat } from "./flower-box-bench.js";
import { reading } from "./reading-seat.js";
import { treeSeat } from "./tree-circle-bench.js";
import { swing } from "./pergola-swing.js";
import { collectionSeatMetadata } from "./metadata.js";

const constructions = {
  "fern-scroll-bench": park,
  "flower-box-bench": planterSeat,
  "reading-seat": reading,
  "tree-circle-bench": treeSeat,
  "pergola-swing": swing,
};

/** Append approved static seating into the caller's existing geometry batch. */
export function appendCollectionSeat(builder, random, assetId) {
  const construction = constructions[assetId];
  if (!construction) return null;
  prepareCollectionPalette();
  // Each authored model keeps its approved flower arrangement regardless of build order.
  construction(builder, new PropRandom(31));
  return collectionSeatMetadata(assetId);
}
