import * as T from "three";
import { petMaterial } from "./material.js";
export { T };
export { eyes, cheeks, feet, ears, body, head } from "./anatomy.js";
export { scarf, satchel, leaf } from "./accessories.js";
function ownedMaterial(g, color, metal) {
  const data = g.userData;
  const key = color + metal;
  data.materials ??= new Map();
  if (!data.materials.has(key)) data.materials.set(key, petMaterial(color, metal));
  return data.materials.get(key);
}
function sphere(g) {
  return (g.userData.sphere ??= new T.SphereGeometry(1, 24, 16));
}
export function mesh(g, geo, c, x = 0, y = 0, z = 0, metal = false) {
  const m = new T.Mesh(geo, c?.isMaterial ? c : ownedMaterial(g, c, metal));
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  g.add(m);
  return m;
}
export function ball(g, c, x, y, z, sx, sy = sx, sz = sx) {
  const m = mesh(g, sphere(g), c, x, y, z);
  m.scale.set(sx, sy, sz);
  return m;
}
export function box(g, c, x, y, z, sx, sy, sz, r = 0.09) {
  const s = new T.Shape();
  const w = sx / 2,
    h = sy / 2;
  r = Math.min(r, w, h, sz * 0.425);
  s.moveTo(-w + r, -h);
  s.lineTo(w - r, -h);
  s.quadraticCurveTo(w, -h, w, -h + r);
  s.lineTo(w, h - r);
  s.quadraticCurveTo(w, h, w - r, h);
  s.lineTo(-w + r, h);
  s.quadraticCurveTo(-w, h, -w, h - r);
  s.lineTo(-w, -h + r);
  s.quadraticCurveTo(-w, -h, -w + r, -h);
  const geo = new T.ExtrudeGeometry(s, {
    depth: Math.max(0.001, sz - 2 * r),
    bevelEnabled: true,
    bevelSize: r,
    bevelThickness: r,
    bevelSegments: 3,
    steps: 1,
  });
  geo.center();
  return mesh(g, geo, c, x, y, z);
}
export function cone(g, c, x, y, z, r, h) {
  return mesh(g, new T.ConeGeometry(r, h, 32), c, x, y, z);
}
export function cyl(g, c, x, y, z, rt, rb, h, metal = false) {
  return mesh(g, new T.CylinderGeometry(rt, rb, h, 40), c, x, y, z, metal);
}
export function ring(g, c, x, y, z, r, tube = 0.04, rx = 0) {
  const m = mesh(g, new T.TorusGeometry(r, tube, 12, 48), c, x, y, z);
  m.rotation.x = rx;
  return m;
}
export function line(g, c, points, r = 0.025) {
  return mesh(
    g,
    new T.TubeGeometry(
      new T.CatmullRomCurve3(points.map((p) => new T.Vector3(...p))),
      24,
      r,
      8,
      false,
    ),
    c,
  );
}
