import * as THREE from "three";

function buildShip(resources, sailboat) {
  const root = new THREE.Group();
  root.name = sailboat ? "ocean-passing-sailboat" : "ocean-passing-coaster";
  const add = (shape, color, p, s, r) => resources.mesh(root, shape, color, p, s, r);
  add("round", sailboat ? 0x965e48 : 0x416378, [0, 0, 0], [2.1, 0.85, 6.8]);
  add("box", 0xe1c99d, [0, 0.68, 0], [3.5, 0.24, 10.2]);
  add("box", 0xf3ead2, [0, 1.35, -1.8], [2.5, 1.2, 3]);
  add("box", sailboat ? 0x477e89 : 0xc46552, [0, 2.02, -1.8], [2.8, 0.2, 3.3]);
  for (const side of [-1, 1])
    for (let index = 0; index < 3; index++) {
      add("box", 0x31586b, [side * 1.26, 1.4, -2.7 + index * 0.85], [0.04, 0.38, 0.46]);
    }
  if (sailboat) {
    add("pole", 0x795c47, [0, 4.65, 0.8], [0.095, 8, 0.095]);
    add("sail", 0xffedc4, [0, 1.1, 1], [1, 1.05, 1]);
    add("sail", 0xdea78d, [0, 1.25, 0.5], [1, 0.75, -0.68]);
    add("box", 0xb65749, [0.45, 8.3, 0.8], [0.9, 0.35, 0.04]);
  } else {
    add("box", 0xf3ead2, [0, 2.7, -2], [2, 1.4, 2.2]);
    add("pole", 0x925341, [0, 3.35, 0.6], [0.46, 2, 0.46]);
    add("pole", 0x344c58, [0, 4.39, 0.6], [0.5, 0.22, 0.5]);
    add("box", 0x94a882, [0, 1.35, 3], [2.9, 1.1, 2.9]);
    add("pole", 0x795c47, [0, 3.2, -4.4], [0.07, 4.6, 0.07]);
  }
  return root;
}

/** One distant ship crosses at a time, with quiet intervals between voyages. */
export function createPassingShips(context, group, resources, habitat) {
  const ships = [buildShip(resources, true), buildShip(resources, false)];
  for (const ship of ships) {
    ship.visible = false;
    group.add(ship);
  }
  let wait = 22,
    crossing = false,
    index = 1,
    x = -190,
    wake = 0;
  return {
    update(dt, time) {
      if (!crossing) {
        wait -= dt;
        if (wait > 0) return;
        index = (index + 1) % ships.length;
        x = index ? 190 : -190;
        crossing = true;
      }
      const ship = ships[index];
      const direction = index ? -1 : 1;
      x += dt * direction * (index ? 2.4 : 3);
      const z = 180 + Math.sin(x * 0.01) * 3;
      ship.visible = habitat.clear(x, z, 1.8, 8);
      ship.position.set(x, context.water.sample(x, z) + 0.15, z);
      ship.rotation.set(
        Math.sin(time * 0.65) * 0.025,
        (direction * Math.PI) / 2,
        Math.sin(time * 0.8 + index) * 0.035,
      );
      wake -= dt;
      if (ship.visible && wake <= 0) {
        context.water.ripple(x - direction * 6.2, z - 1.5, 0.35);
        context.water.ripple(x - direction * 6.2, z + 1.5, 0.35);
        wake = 0.9;
      }
      if (Math.abs(x) > 190) {
        ship.visible = false;
        crossing = false;
        wait = index ? 115 : 75;
      }
    },
  };
}
