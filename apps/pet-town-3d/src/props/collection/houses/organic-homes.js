import { T, P as p } from "../shared/geometry.js";
import { appendCottageWindowGeometry as win } from "../../building-details/append-cottage-window-geometry.js";
import { appendRoundWindowGeometry as round } from "../../building-details/append-round-window-geometry.js";
import { appendLanternGeometry } from "../../street-furniture/append-lantern-geometry.js";
import { buildBarrelProp } from "../../street-furniture/build-barrel-prop.js";
import { appendHangingBasketGeometry } from "../../cottages/append-hanging-basket-geometry.js";
import { block } from "./cottage-style.js";
export function organic(b, r, n) {
  let rad = n === 0 ? 2 : 1.9,
    h = n === 1 ? 4.8 : 3;
  let wall = n === 2 ? "wood" : n === 1 ? "stone" : "plaster";
  b.add("stone", new T.CylinderGeometry(rad + 0.22, rad + 0.3, 0.5, 48), {
    y: 0.25,
    tint: p.stone,
  });
  b.add(wall, new T.CylinderGeometry(rad, rad + 0.08, h, 48, 8), {
    y: 0.5 + h / 2,
    tint: n === 2 ? 0xc59b6e : 0xf3ddba,
  });
  if (n === 0) {
    b.add("shingle", new T.SphereGeometry(3, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2), {
      y: 3.45,
      sy: 0.5,
      tint: 0xd87257,
      noAO: true,
      uv: { mode: "native", su: 4, sv: 2 },
    });
    b.add("wood", new T.CylinderGeometry(2.92, 2.95, 0.16, 48), {
      y: 3.44,
      tint: p.woodDark,
    });
    for (let i = 0; i < 12; i++) {
      let a = i * 2.4,
        rr = 1.2 + (i % 3) * 0.5;
      b.add("paint", new T.SphereGeometry(0.18, 12, 8), {
        x: Math.sin(a) * rr,
        y: 3.45 + Math.sqrt(9 - rr * rr) * 0.5,
        z: Math.cos(a) * rr,
        sy: 0.2,
        tint: p.trim,
        noAO: true,
      });
    }
  }
  if (n === 1) {
    b.add("shingle", new T.ConeGeometry(2.6, 2.6, 48), {
      y: 6.5,
      tint: 0x729c92,
      noAO: true,
    });
    b.add("paint", new T.TorusGeometry(2.38, 0.12, 8, 48), {
      y: 5.3,
      rx: Math.PI / 2,
      tint: p.trim,
    });
    for (let a of [0, 0.9, 1.8]) {
      b.push(Math.sin(a) * rad, 4.1, Math.cos(a) * rad, 0, a, 0);
      round(b, r, 0.35, p.trim);
      b.pop();
    }
  }
  if (n === 2) {
    b.add("shingle", new T.ConeGeometry(2.6, 1.7, 48), {
      y: 4.32,
      tint: 0x719052,
      noAO: true,
    });
    for (let i = 0; i < 14; i++) {
      let a = (i * Math.PI) / 7;
      block(b, "wood", 0.18, 3, 0.18, Math.sin(a) * rad, 2, Math.cos(a) * rad, p.timber);
    }
    for (let i = 0; i < 6; i++) {
      let a = (i * Math.PI) / 3;
      b.add("wood", new T.CylinderGeometry(0.17, 0.34, 1.1, 10), {
        x: Math.sin(a) * 2.1,
        y: 0.4,
        z: Math.cos(a) * 2.1,
        rz: Math.cos(a) * 0.7,
        rx: Math.sin(a) * 0.7,
        tint: p.timber,
      });
    }
  }
  block(b, "paint", 1.05, 2.08, 0.12, 0, 1.54, rad + 0.08, p.doorTeal);
  for (let x of [-0.61, 0.61]) block(b, "paint", 0.15, 2.25, 0.18, x, 1.55, rad + 0.1, p.trim);
  block(b, "paint", 1.35, 0.15, 0.18, 0, 2.7, rad + 0.1, p.trim);
  block(b, "wood", 1.8, 0.25, 0.95, 0, 0.4, rad + 0.45, p.woodWarm);
  block(b, "wood", 2, 0.16, 0.65, 0, 0.17, rad + 0.78, p.woodWarm);
  b.push(0, 2.1, rad + 0.16);
  round(b, r, 0.19, p.trim);
  b.pop();
  for (let a of [-0.75, 0.75, 1.65]) {
    b.push(Math.sin(a) * rad, 2.07, Math.cos(a) * rad, 0, a, 0);
    win(b, r, {
      w: 0.78,
      h: 1.05,
      trim: p.trim,
      shutter: n === 2 ? p.shutterGreen : p.shutterBlue,
      box: p.woodWarm,
    });
    b.pop();
  }
  b.push(0.84, 2.35, rad + 0.25);
  appendLanternGeometry(b, 0, 0, 0, 0.75);
  b.pop();
  b.push(-rad * 0.98, 2.8, 0.65);
  appendHangingBasketGeometry(b, r, 0, 0, 0, p.pink);
  b.pop();
  b.push(rad + 0.4, 0, 0.5);
  buildBarrelProp(b, r, { h: 0.8, r: 0.32, water: true });
  b.pop();
}
