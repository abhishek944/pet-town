import { prepareCollectionPalette, PropRandom } from "../shared/geometry.js";
import { appendTwinLantern } from "./twin-lantern.js";
import { appendFlowerLantern } from "./flower-lantern.js";
import { appendCelestialGlobe } from "./celestial-globe.js";
import { appendMushroomLantern } from "./mushroom-lantern.js";
import { appendLilyBellLamp } from "./lily-bell-lamp.js";
import { collectionLightMetadata } from "./metadata.js";

/** Appends the approved seed-42 light study in the caller's local frame. */
export function appendCollectionLight(builder, random, assetId) {
  prepareCollectionPalette();
  const metadata = collectionLightMetadata(assetId);
  const lights = [];
  const decorationRandom = new PropRandom(42);
  switch (assetId) {
    case "twin-lantern":
      appendTwinLantern(builder, lights);
      break;
    case "flower-lantern":
      appendFlowerLantern(builder, decorationRandom, lights);
      break;
    case "celestial-globe":
      appendCelestialGlobe(builder, lights);
      break;
    case "mushroom-lantern":
      appendMushroomLantern(builder, lights);
      break;
    case "lily-bell-lamp":
      appendLilyBellLamp(builder, decorationRandom, lights);
      break;
  }
  return { ...metadata, lights };
}
