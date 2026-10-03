import { T, P, box } from "../shared/geometry.js";
export function appendCelestialGlobe(b, lights) {
  box(b, "stone", 1.5, 0.4, 0.65, 0, 0.2, 0, P.stone);
  for (let x of [-0.65, 0.65]) box(b, "stone", 0.25, 0.2, 0.7, x, 0.46, 0, P.stone);
  b.add("metal", new T.TorusGeometry(1, 0.075, 12, 64), { y: 1.5, tint: 0x789987 });
  b.add("lamp", new T.SphereGeometry(0.35, 32, 20), { y: 1.7, tint: P.trim, noAO: true });
  for (let ry of [0, Math.PI / 2, Math.PI / 4])
    b.add("metal", new T.TorusGeometry(0.374, 0.02, 8, 48), { y: 1.7, ry, tint: P.brass });
  box(b, "metal", 0.04, 0.36, 0.04, 0, 2.21, 0, P.brass);
  for (let rz of [0, Math.PI / 2]) box(b, "metal", 0.055, 0.36, 0.055, 0, 2.69, 0, P.brass, { rz });
  b.add("metal", new T.OctahedronGeometry(0.1), { y: 2.69, tint: P.brass });
  for (let x of [-0.73, 0.73]) {
    box(b, "metal", 0.016, 0.28, 0.016, x, 2.1, 0, P.brass);
    b.add("metal", new T.OctahedronGeometry(0.065), { x, y: 1.88, tint: P.brass });
  }
  lights.push({ x: 0, y: 1.7, z: 0 });
}
