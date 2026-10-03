import { getWorldAsset } from "./catalog.js";
import { appendCollectionHouse } from "./houses/index.js";
import { appendCollectionSeat } from "./seats/index.js";
import { appendCollectionLight } from "./lights/index.js";
import { appendCollectionScenery } from "./scenery/index.js";
import { PropRandom } from "../math/prop-random.js";

const appenders = {
  Buildings: appendCollectionHouse,
  Seating: appendCollectionSeat,
  Lights: appendCollectionLight,
  Scenery: appendCollectionScenery,
};

export function appendWorldAsset(builder, random, id) {
  const asset = getWorldAsset(id);
  if (!asset) throw new Error("This asset is unavailable.");
  const previousRandom = builder.rng;
  builder.rng = new PropRandom(asset.seed);
  try {
    return appenders[asset.category](builder, random, id);
  } finally {
    builder.rng = previousRandom;
  }
}
