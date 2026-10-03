import * as THREE from "three";

export function addHarborLaunchDetails(kit) {
  const { box, pole, rope, add } = kit;
  for (const side of [-1, 1]) {
    box([0.7, 0.18, 2], 0xc79460, [side * 1.4, 0.95, 0.5]);
    for (const z of [-0.4, 1.4]) box([0.1, 0.32, 0.15], 0x705540, [side * 1.4, 0.78, z]);
    pole(0.07, 0.65, 0x96683f, [side * 1.25, 0.98, 2]);
    rope([
      [side * 1.25, 1.28, 2],
      [side * 1.55, 1.12, 0.4],
      [side * 1.6, 1.2, -1.8],
    ]);
  }
  add(new THREE.TorusGeometry(0.3, 0.105, 10, 24), 0xe6dbc0, [1.7, 0.28, -0.5]);
  for (let i = 0; i < 4; i++)
    add(
      new THREE.TorusGeometry(0.3, 0.11, 8, 6, Math.PI * 0.5),
      0xcc7560,
      [1.7, 0.28, -0.5],
      [0, 0, i * Math.PI * 0.5],
    );
  pole(0.085, 0.7, 0x916643, [0, 0.88, 2.4]);
  rope(
    [
      [0, 1.24, 2.4],
      [-0.25, 1.28, 2.35],
      [-0.32, 1.3, 2.5],
      [0.2, 1.3, 2.55],
      [0.3, 1.3, 2.35],
      [0, 1.24, 2.4],
    ],
    0xe6d2a7,
    0.04,
  );
  pole(0.035, 1.05, 0x805f45, [0, 2.73, -1.45]);
  box([0.45, 0.2, 0.025], 0xe8b968, [0.22, 3.14, -1.45]);
  add(
    new THREE.SphereGeometry(1, 12, 8),
    0xffd779,
    [1.12, 1.6, -0.15],
    undefined,
    [0.16, 0.23, 0.16],
  );
  // The helm faces the open bow. The side ladder reaches below the waterline.
  pole(0.09, 0.7, 0x916643, [0, 1.01, 1.85]);
  add(new THREE.TorusGeometry(0.23, 0.035, 8, 20), 0x815e3e, [0, 1.4, 1.85], [-0.3, 0, 0]);
  for (let i = 0; i < 4; i++)
    box([0.43, 0.04, 0.04], 0xb99b63, [0, 1.4, 1.85], [0, 0, (i * Math.PI) / 4]);
  for (const z of [2.15, 2.85]) pole(0.05, 1.4, 0xe0cba1, [1.5, 0.02, z]);
  for (let y = -0.55; y < 0.65; y += 0.26) box([0.16, 0.065, 0.74], 0xc99661, [1.5, y, 2.5]);
}
