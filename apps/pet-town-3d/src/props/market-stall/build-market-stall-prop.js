/** Detailed market stall geometry and decorative flat leaf geometry. */
import { buildMarketCounter } from "./build-market-counter.js";
import { buildMarketShelves } from "./build-market-shelves.js";
import { buildMarketAwning } from "./build-market-awning.js";
import { stockMarketProduce } from "./stock-market-produce.js";
import { buildMarketSign } from "./build-market-sign.js";
import { buildMarketStorage } from "./build-market-storage.js";
import { finishMarketMetadata } from "./finish-market-metadata.js";
export function buildMarketStallProp(builder, random, settings = {}) {
  const stall = {
    builder,
    random,
    settings,
  };
  buildMarketCounter(stall);
  buildMarketShelves(stall);
  buildMarketAwning(stall);
  stockMarketProduce(stall);
  buildMarketSign(stall);
  buildMarketStorage(stall);
  finishMarketMetadata(stall);
  return stall.metadata;
}
