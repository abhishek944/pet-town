import {
  T,
  P,
  box,
  cylinder,
  tube,
  door,
  window,
  lantern,
  planter,
  garden,
} from "../shared/geometry.js";
import { buildWindmillSailsGeometry } from "../../windmills/build-windmill-sails-geometry.js";
import { buildCottageProp } from "../../cottages/build-cottage-prop.js";
import { propsState } from "../../state.js";
export function windmill(b, r) {
  cylinder(b, "stone", 2.15, 0.55, 0, 0.275, 0, P.stone);
  cylinder(b, "plaster", 2.06, 4.8, 0, 2.9, 0, 0xf8e9c9, 1.63);
  for (let yy of [0.6, 3, 5.12])
    b.add("wood", new T.TorusGeometry(yy === 0.6 ? 2.06 : yy === 3 ? 1.87 : 1.68, 0.08, 8, 48), {
      y: yy,
      rx: Math.PI / 2,
      tint: P.woodWarm,
    });
  cylinder(b, "shingle", 2.16, 2.1, 0, 6.16, 0, P.roofTeal, 0.08);
  b.add("metal", new T.SphereGeometry(0.14, 16, 12), {
    y: 7.26,
    tint: P.brass,
  });
  door(b, 0, 0.55, 2.07, 0x598bad);
  for (let a of [-0.9, 0.9, 1.8])
    window(b, r, Math.sin(a) * 1.95, 2.17, Math.cos(a) * 1.95, 0.7, 1.04, null, P.woodWarm, a);
  b.push(0, 4.75, 2.13, 0, 0, 0.18, 0.52);
  buildWindmillSailsGeometry(b, r);
  b.pop();
  let arc = [];
  for (let i = 0; i <= 12; i++) {
    let a = -1 + i / 6;
    arc.push([Math.sin(a) * 2.3, 3.36, Math.cos(a) * 2.3]);
  }
  tube(b, "wood", arc, 0.075, P.woodWarm);
  for (let i = 0; i <= 12; i++) {
    let a = -1 + i / 6;
    box(b, "wood", 0.07, 0.65, 0.07, Math.sin(a) * 2.3, 3.03, Math.cos(a) * 2.3, P.woodWarm);
  }
  b.add("wood", new T.CylinderGeometry(2.4, 2.4, 0.14, 48, 1, false, -1, 2), {
    y: 2.7,
    tint: P.woodWarm,
  });
  b.push(2.9, 0, -0.2, 0, Math.PI / 2, 0, 0.65);
  const shed = buildCottageProp(b, r, {
    ...propsState.cottageVariants.main,
    W: 3.4,
    D: 3.4,
    wallH: 2.6,
    doorX: 0,
    frontWindows: [],
    chimney: "stone",
    roof: P.roofRed,
    ivy: true,
    barrel: false,
    baskets: true,
  });
  b.pop();
  lantern(b, -0.85, 2.6, 2.13);
  planter(b, r, -1.8, 0, 2.2, 1, P.yellow);
  planter(b, r, 1.8, 0, 2.3, 0.9, P.pink);
  garden(b, r, 3.6);
  return shed;
}
