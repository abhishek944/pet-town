import * as THREE from "three";
import { OCEAN_PLACES } from "../layout.js";

function buildTurtle(resources, index) {
  const root = new THREE.Group();
  root.name = `ocean-sea-turtle-${index}`;
  const skin = index ? 0x9fbf82 : 0x84b4a0;
  const shell = index ? 0x658c5a : 0x568b77;
  const add = (shape, color, p, s, r, owner = root) => resources.mesh(owner, shape, color, p, s, r);
  add("round", 0xd6cda3, [0, -0.13, 0], [0.75, 0.22, 1]);
  add("round", shell, [0, 0.12, 0], [0.8, 0.42, 1.05]);
  for (const z of [-0.5, 0, 0.5]) {
    add("round", 0x8daf77, [0, 0.41, z], [0.25, 0.07, 0.28]);
    for (const side of [-1, 1]) add("round", 0x709568, [side * 0.39, 0.32, z], [0.23, 0.06, 0.26]);
  }
  add("round", skin, [0, -0.02, 1.07], [0.26, 0.23, 0.39]);
  add("round", skin, [0, -0.07, -1.1], [0.09, 0.07, 0.23]);
  for (const side of [-1, 1]) {
    add("round", 0x1d3936, [side * 0.22, 0.08, 1.19], [0.043, 0.043, 0.043]);
    add("round", 0xf9f1d8, [side * 0.245, 0.09, 1.205], [0.013, 0.013, 0.013]);
  }
  const flippers = [];
  for (const side of [-1, 1])
    for (const front of [true, false]) {
      const fin = new THREE.Group();
      fin.position.set(side * 0.58, -0.06, front ? 0.58 : -0.66);
      root.add(fin);
      add(
        "round",
        skin,
        [side * 0.4, 0, -0.1],
        [front ? 0.68 : 0.45, 0.055, 0.2],
        [0, side * 0.4, 0],
        fin,
      );
      flippers.push({ fin, side, front });
    }
  return { root, flippers };
}

export function createSeaTurtles(context, group, resources, habitat) {
  const kelp = OCEAN_PLACES.find((place) => place.id === "kelp");
  const turtles = [buildTurtle(resources, 0), buildTurtle(resources, 1)];
  for (const turtle of turtles) group.add(turtle.root);
  return {
    update(dt, time) {
      turtles.forEach((turtle, index) => {
        const phase = time * 0.075 + index * Math.PI;
        const x = kelp.x + 5 + Math.cos(phase) * 5;
        const z = kelp.z + Math.sin(phase) * 7;
        turtle.root.visible = habitat.clear(x, z, 2.5, 1.7);
        if (!turtle.root.visible) return;
        const breath = Math.max(0, Math.sin(time * 0.045 + index * 2) - 0.8) * 5;
        const depth = Math.min(habitat.depth(x, z) - 0.7, 1.8 - breath * 1.4);
        turtle.root.position.set(x, context.water.sample(x, z) - depth, z);
        turtle.root.rotation.y = Math.atan2(-Math.sin(phase) * 5, Math.cos(phase) * 7);
        turtle.root.rotation.x = Math.sin(time * 0.45 + index) * 0.035;
        for (const { fin, side, front } of turtle.flippers) {
          fin.rotation.z = Math.sin(time * 1.6 + index + (front ? 0 : 1)) * side * 0.26;
        }
      });
    },
  };
}
