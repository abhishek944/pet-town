import { P as p, propsState } from "../shared/geometry.js";
import { buildCottageProp } from "../../cottages/build-cottage-prop.js";
import { buildCrateProp } from "../../street-furniture/build-crate-prop.js";
import { appendHangingBasketGeometry } from "../../cottages/append-hanging-basket-geometry.js";
import { conservatory } from "./conservatory.js";
function cottage(b, r, opts) {
  return buildCottageProp(b, r, {
    ...propsState.cottageVariants.main,
    ...opts,
  });
}
export function gardenHouse(b, r, n) {
  let metadata;
  const base = {
    barrel: true,
    ivy: true,
    baskets: true,
    woodpile: true,
    frontShutters: true,
  };
  if (n === 0)
    metadata = cottage(b, r, {
      ...base,
      W: 5.8,
      D: 4.4,
      wallTint: 0xf8dfb8,
      roof: 0x7b9b58,
      door: 0x659e6b,
      shutter: 0x87aa65,
      flowers: p.yellow,
      dormer: true,
      flowerCols: [p.yellow, p.pink, p.white],
    });
  if (n === 1) {
    metadata = cottage(b, r, {
      ...propsState.cottageVariants.cabin,
      W: 6.1,
      D: 4.2,
      wallTint: 0xe4ebd1,
      roof: 0x68988b,
      frontWindows: [-1.8, 1.8],
      door: p.doorTeal,
      dormer: false,
      chimney: false,
      ivy: true,
      barrel: true,
      baskets: true,
    });
    b.push(3.75, 0, 0.2, 0, Math.PI / 2, 0, 0.72);
    conservatory(b, r);
    b.pop();
  }
  if (n === 2) {
    metadata = cottage(b, r, {
      ...base,
      W: 5.1,
      D: 4.2,
      wallTint: 0xf4decd,
      roof: 0xb581a8,
      shutter: 0x789e65,
      door: 0x738fab,
      frontWindows: [1.55],
      dormer: true,
      flowers: p.lilac,
    });
    b.push(-3.3, 0, 1.3);
    buildCrateProp(b, r, { s: 0.7 });
    b.pop();
    b.push(-3.2, 0.67, 1.3);
    appendHangingBasketGeometry(b, r, 0, 0.7, 0, p.lilac);
    b.pop();
  }

  metadata.walk = [];
  metadata.radius = n === 1 ? 5.7 : 4.7;
  if (n === 1)
    metadata.colliders.push({
      x: 3.75,
      z: 0.2,
      w: 3.9 * 0.72,
      d: 4.1 * 0.72,
      radius: 2.05,
      h: 3.9 * 0.72,
      noTop: true,
    });
  if (n === 2)
    metadata.colliders.push({
      x: -3.3,
      z: 1.3,
      w: 0.7,
      d: 0.7,
      radius: 0.5,
      h: 0.7,
    });
  return metadata;
}
