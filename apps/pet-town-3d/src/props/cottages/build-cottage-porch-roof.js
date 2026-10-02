/** Cottage variants, porch and stair layout, cottage geometry and hanging baskets. */
import { buildCottageVeranda } from "./build-cottage-veranda.js";
import { buildCottageGabledPorch } from "./build-cottage-gabled-porch.js";
export function buildCottagePorchRoof(cottage) {
  cottage.porchRoofY = 3;
  if (cottage.settings.porch === `veranda`) {
    buildCottageVeranda(cottage);
  } else {
    buildCottageGabledPorch(cottage);
  }
}
