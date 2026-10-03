import {
  T,
  P,
  box,
  cylinder,
  tube,
  door,
  lantern,
  planter,
  garden,
  curvyRoof,
} from "../shared/geometry.js";
export function glassHome(b, r) {
  cylinder(b, "stone", 2.7, 0.55, 0, 0.27, 0, P.stone);
  cylinder(b, "wood", 2.6, 0.22, 0, 0.62, 0, P.woodWarm);
  b.add("collectionGlass", new T.SphereGeometry(2.65, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), {
    y: 2.3,
    sy: 1.1,
    tint: 0xbbebe2,
    noAO: true,
    uv: { mode: "native" },
  });
  cylinder(b, "collectionGlass", 2.65, 1.63, 0, 1.5, 0, 0xc7e9dc);
  for (let i = 0; i < 16; i++) {
    let a = (i * Math.PI) / 8,
      pts = [];
    for (let j = 0; j <= 16; j++) {
      let t = (j * Math.PI) / 32;
      pts.push([
        Math.sin(a) * 2.69 * Math.sin(t),
        2.3 + 2.95 * Math.cos(t),
        Math.cos(a) * 2.69 * Math.sin(t),
      ]);
    }
    tube(b, "metal", pts, 0.042, 0x528c7c);
    box(b, "metal", 0.07, 1.66, 0.07, Math.sin(a) * 2.69, 1.5, Math.cos(a) * 2.69, 0x528c7c);
  }
  for (let yy of [0.65, 1.45, 2.3, 3.38, 4.2]) {
    let rr = yy <= 2.3 ? 2.69 : 2.69 * Math.sqrt(1 - ((yy - 2.3) / 2.95) ** 2);
    b.add("metal", new T.TorusGeometry(rr, 0.048, 8, 64), {
      y: yy,
      rx: Math.PI / 2,
      tint: 0x528c7c,
    });
  }
  b.add("metal", new T.SphereGeometry(0.13, 16, 12), {
    y: 5.35,
    tint: P.brass,
  });
  box(b, "plaster", 1.9, 2.1, 1.3, 0, 1.6, 2.4, P.plaster);
  b.push(0, 0, 2.4);
  curvyRoof(b, 2, 1.5, 2.65, P.roofRed);
  b.pop();
  door(b, 0, 0.55, 3.08, 0xb18a4f, 0.95, 1.9);
  lantern(b, 0.78, 2.25, 3.13);
  for (let i = 0; i < 9; i++) {
    let a = i * 2.4;
    let xx = Math.sin(a) * 1.7,
      zz = Math.cos(a) * 1.7;
    planter(b, r, xx, 0.68, zz, 0.8, [P.pink, P.yellow, P.lilac][i % 3]);
    cylinder(b, "wood", 0.026, 1.65, xx, 1.82, zz, P.leafDark);
    for (let j = 0; j < 7; j++) {
      let ang = a + j * 1.9;
      b.add("leaf", new T.SphereGeometry(0.28, 12, 8), {
        x: xx + Math.sin(ang) * 0.23,
        y: 1.36 + j * 0.17,
        z: zz + Math.cos(ang) * 0.23,
        sx: 1.45,
        sy: 0.2,
        sz: 0.8,
        ry: ang,
        rz: 0.2,
        tint: j % 2 ? P.leaf : P.leafLight,
      });
    }
  }
  planter(b, r, -1.15, 0, 3, 0.95, P.lilac);
  planter(b, r, 1.22, 0, 2.98, 0.9, P.yellow);
  for (let i = 0; i < 8; i++) {
    let y = 0.9 + i * 0.46;
    planter(b, r, 2.55, y, Math.sin(i * 0.7) * 0.35, 0.3, P.white);
  }
  garden(b, r, 3.3);
}
