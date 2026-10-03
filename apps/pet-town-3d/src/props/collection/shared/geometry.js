import * as T from "three";
import { propsState } from "../../state.js";
import { PropGeometryBuilder } from "../../geometry-builder/prop-geometry-builder.js";
import { PropRandom } from "../../math/prop-random.js";
import { getPropMaterials } from "../../materials/get-prop-materials.js";
import { createBeveledPropBox } from "../../geometry/create-beveled-prop-box.js";
import { extrudePropShape } from "../../geometry/extrude-prop-shape.js";
import { createArchedPropShape } from "../../geometry/create-arched-prop-shape.js";
import { appendCottageWindowGeometry } from "../../building-details/append-cottage-window-geometry.js";
import { appendRoundWindowGeometry } from "../../building-details/append-round-window-geometry.js";
import { appendLeafRosetteGeometry } from "../../building-details/append-leaf-rosette-geometry.js";
import { appendGardenFlowerGeometry } from "../../garden-geometry/append-garden-flower-geometry.js";
import { appendLanternGeometry } from "../../street-furniture/append-lantern-geometry.js";
export { T, propsState, PropGeometryBuilder, PropRandom, getPropMaterials, extrudePropShape };
export const P = {};
export function prepareCollectionPalette() {
  Object.assign(P, propsState.propPalette);
}
export function box(b, kind, w, h, d, x, y, z, tint, extra = {}) {
  b.add(kind, createBeveledPropBox(w, h, d, Math.min(0.065, w / 5, h / 5, d / 5)), {
    x,
    y,
    z,
    tint,
    ...extra,
  });
}
export function cylinder(b, kind, r, h, x, y, z, tint, top = r) {
  b.add(kind, new T.CylinderGeometry(top, r, h, 40, 4), { x, y, z, tint });
}
export function tube(b, kind, points, r, col) {
  b.add(
    kind,
    new T.TubeGeometry(
      new T.CatmullRomCurve3(points.map((p) => new T.Vector3(...p))),
      48,
      r,
      8,
      false,
    ),
    { tint: col, noAO: true },
  );
}
export function door(b, x, y, z, col = P.doorTeal, w = 1.12, h = 2.1) {
  b.push(x, y, z);
  b.add("paint", extrudePropShape(createArchedPropShape(w, h), 0.13, 0.02, 18), {
    tint: col,
    z: 0.06,
    uv: { grain: 1 },
  });
  let frame = createArchedPropShape(w + 0.3, h + 0.15);
  frame.holes.push(createArchedPropShape(w, h));
  b.add("stone", extrudePropShape(frame, 0.22, 0.02, 18), { tint: P.trim, z: 0.03 });
  b.add("metal", new T.TorusGeometry(0.085, 0.025, 8, 16), {
    x: w * 0.33,
    y: 1,
    z: 0.25,
    tint: P.brass,
  });
  for (let yy of [0.55, 1.5]) box(b, "metal", 0.42, 0.06, 0.04, -w * 0.28, yy, 0.23, P.iron);
  b.pop();
}
export function window(
  b,
  r,
  x,
  y,
  z,
  w = 1,
  h = 1.15,
  shutter = P.shutterGreen,
  boxCol = P.woodWarm,
  rot = 0,
) {
  b.push(x, y, z, 0, rot, 0);
  appendCottageWindowGeometry(b, r, { w, h, trim: P.trim, shutter, box: boxCol });
  b.pop();
}
export function porthole(b, r, x, y, z, rad = 0.3, col = P.brass, rot = 0) {
  b.push(x, y, z, 0, rot, 0);
  appendRoundWindowGeometry(b, r, rad, col);
  for (let i = 0; i < 8; i++)
    b.add("metal", new T.SphereGeometry(0.025, 6, 4), {
      x: Math.sin((i * Math.PI) / 4) * (rad + 0.07),
      y: Math.cos((i * Math.PI) / 4) * (rad + 0.07),
      z: 0.12,
      tint: col,
    });
  b.pop();
}
export function lantern(b, x, y, z) {
  appendLanternGeometry(b, x, y, z, 0.82);
}
export function planter(b, r, x, y, z, scale = 0.8, colour = P.pink) {
  cylinder(
    b,
    "plain",
    0.33 * scale,
    0.45 * scale,
    x,
    y + 0.22 * scale,
    z,
    P.terracotta,
    0.42 * scale,
  );
  b.push(x, y + 0.45 * scale, z, 0, 0, 0, scale);
  appendLeafRosetteGeometry(b, r, 0, 0, 0, 0.9, 9);
  for (let i = 0; i < 7; i++)
    appendGardenFlowerGeometry(b, r, r.range(-0.27, 0.27), r.range(-0.27, 0.27), {
      y: 0,
      h: r.range(0.2, 0.48),
      color: i % 3 ? colour : P.white,
    });
  b.pop();
}
export function garden(b, r, rad = 4) {
  for (let i = 0; i < 25; i++) {
    let a = i * 2.399,
      rr = rad + 0.15 + r.range(-0.3, 0.6),
      x = Math.sin(a) * rr,
      z = Math.cos(a) * rr;
    if (z > rad - 0.45 && Math.abs(x) < 1.3) continue;
    appendLeafRosetteGeometry(b, r, x, 0.02, z, r.range(0.5, 0.95), 6);
    for (let j = 0; j < 3; j++)
      appendGardenFlowerGeometry(b, r, x + r.range(-0.15, 0.15), z + r.range(-0.15, 0.15), {
        y: 0.02,
        h: r.range(0.12, 0.3),
        color: [P.pink, P.white, P.yellow, P.lilac][i % 4],
      });
  }
  for (let i = 0; i < 4; i++) {
    let x = (i % 2 ? 1 : -1) * 0.37,
      z = rad - 0.3 + i * 0.4;
    b.add("stone", new T.CylinderGeometry(0.33, 0.39, 0.1, 7), {
      x,
      y: 0.04,
      z,
      tint: P.stone,
      sy: 0.8,
    });
  }
}
export function curvyRoof(b, w, d, y, col) {
  let shape = new T.Shape();
  shape.moveTo(-w / 2 - 0.35, 0);
  shape.quadraticCurveTo(-w * 0.22, 0.28, 0, w * 0.5);
  shape.quadraticCurveTo(w * 0.25, 0.32, w / 2 + 0.35, 0);
  shape.lineTo(w / 2 + 0.35, -0.2);
  shape.quadraticCurveTo(w * 0.25, 0.1, 0, w * 0.5 - 0.22);
  shape.quadraticCurveTo(-w * 0.22, 0.08, -w / 2 - 0.35, -0.2);
  shape.closePath();
  let fill = new T.Shape();
  fill.moveTo(-w / 2, 0);
  fill.quadraticCurveTo(-w * 0.22, 0.28, 0, w * 0.5 - 0.08);
  fill.quadraticCurveTo(w * 0.25, 0.32, w / 2, 0);
  fill.closePath();
  let gable = extrudePropShape(fill, d, 0.015, 30);
  gable.translate(0, y - 0.12, 0);
  b.add("plaster", gable, { tint: P.plaster });
  let geo = extrudePropShape(shape, d + 0.6, 0.055, 30);
  geo.translate(0, y, 0);
  b.add("shingle", geo, { tint: col, noAO: true });
  for (let z of [-d / 2 - 0.34, d / 2 + 0.34]) {
    tube(
      b,
      "paint",
      [
        [-w / 2 - 0.38, y - 0.08, z],
        [-w * 0.28, y + 0.42, z],
        [0, y + w * 0.5 - 0.08, z],
        [w * 0.28, y + 0.42, z],
        [w / 2 + 0.38, y - 0.08, z],
      ],
      0.095,
      P.trim,
    );
  }
  box(b, "shingle", 0.34, 0.2, d + 0.75, 0, y + w * 0.5, 0, col);
}
