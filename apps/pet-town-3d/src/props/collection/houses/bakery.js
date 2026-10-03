import {
  T,
  P,
  box,
  tube,
  door,
  window,
  porthole,
  lantern,
  planter,
  garden,
  curvyRoof,
} from "../shared/geometry.js";
export function bakery(b, r) {
  box(b, "stone", 4.6, 0.45, 3.8, 0, 0.22, 0, P.stone);
  box(b, "plaster", 4.4, 2.7, 3.5, 0, 1.8, 0, P.plasterPeach);
  box(b, "plaster", 3.9, 2.05, 3.8, -0.65, 4.05, -0.05, P.plaster);
  for (let x of [-2.5, -0.65, 1.25]) box(b, "wood", 0.22, 2.15, 0.23, x, 4.04, 1.88, P.timber);
  for (let yy of [3.02, 4.97]) box(b, "wood", 4.05, 0.22, 0.22, -0.65, yy, 1.87, P.timber);
  for (let x of [-2.1, 0.4])
    box(b, "wood", 0.17, 1.75, 0.2, x, 4.03, 1.91, P.timber, {
      rz: x < 0 ? -0.55 : 0.55,
    });
  b.push(-0.65, 0, -0.05);
  curvyRoof(b, 4.1, 3.8, 5.02, P.roofRed);
  b.pop();
  window(b, r, -0.65, 4.12, 1.91, 1.08, 1.18, P.shutterGreen, P.woodWarm);
  box(b, "plaster", 2.2, 3.45, 2.9, 2.16, 2.15, 0.2, P.plasterPeach);
  b.push(2.16, 0, 0.2);
  curvyRoof(b, 2.3, 2.9, 3.85, P.roofRed);
  b.pop();
  door(b, 2.2, 0.45, 1.73, P.doorTeal);
  porthole(b, r, 2.2, 3.4, 1.72, 0.24, P.trim);
  window(b, r, 3.29, 2.13, 0.35, 0.75, 1.08, P.shutterGreen, false, Math.PI / 2);
  lantern(b, 1.2, 2.5, 1.82);
  box(b, "glass", 2.72, 1.55, 0.12, -0.62, 1.72, 1.81, P.white, {
    uv: { mode: "unit" },
    noAO: true,
  });
  for (let x of [-2, -0.62, 0.76]) box(b, "paint", 0.12, 1.73, 0.18, x, 1.7, 1.85, P.doorTeal);
  box(b, "wood", 2.9, 0.25, 0.45, -0.62, 0.76, 1.93, P.woodWarm);
  for (let yy of [1.04, 1.77]) {
    box(b, "wood", 2.55, 0.09, 0.28, -0.62, yy, 2.07, P.woodWarm);
    for (let i = 0; i < 5; i++) {
      b.add("plain", new T.SphereGeometry(0.16, 16, 10), {
        x: -1.65 + i * 0.51,
        y: yy + 0.16,
        z: 2.15,
        sx: 1.2,
        sy: 0.85,
        tint: i % 2 ? 0xe4ae67 : 0xc48542,
        noAO: true,
      });
    }
  }
  for (let i = 0; i < 9; i++) {
    let x = -2.2 + i * 0.36;
    box(b, "paint", 0.34, 0.07, 1.24, x, 2.94, 2.35, i % 2 ? P.trim : 0xd8795f, {
      rx: 0.17,
      noAO: true,
    });
    b.add("paint", new T.SphereGeometry(0.18, 16, 8, 0, Math.PI * 2, 0, Math.PI), {
      x,
      y: 2.75,
      z: 2.94,
      sz: 0.2,
      tint: i % 2 ? P.trim : 0xd8795f,
    });
  }
  box(b, "wood", 0.1, 0.1, 1.24, -2.4, 3.05, 2.35, P.woodDark);
  box(b, "wood", 0.1, 0.1, 1.24, 1, 3.05, 2.35, P.woodDark);
  tube(
    b,
    "metal",
    [
      [-2.4, 3.9, 1.6],
      [-3.1, 4, 1.8],
      [-3.2, 3.7, 1.9],
    ],
    0.055,
    P.iron,
  );
  box(b, "wood", 0.78, 0.95, 0.16, -3.14, 3.2, 1.9, P.woodWarm);
  b.add("plain", new T.CapsuleGeometry(0.11, 0.54, 8, 12), {
    x: -3.14,
    y: 3.2,
    z: 2.02,
    rz: -0.38,
    tint: P.yellow,
  });
  for (let i = 0; i < 3; i++)
    box(b, "plain", 0.17, 0.025, 0.04, -3.2 + i * 0.045, 3.08 + i * 0.15, 2.14, P.cream, {
      rz: 0.6,
    });
  box(b, "brick", 0.7, 2, 0.64, 1.2, 5.9, -0.7, P.stone);
  planter(b, r, -2.6, 0, 2.3, 0.85, P.yellow);
  planter(b, r, 3.25, 0, 1.95, 1.1, P.lilac);
  garden(b, r, 3.7);
}
