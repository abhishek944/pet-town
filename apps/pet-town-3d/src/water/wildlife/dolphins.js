import * as THREE from "three";
import { OCEAN_PLACES } from "../layout.js";

function model(resources, index) {
  const root = new THREE.Group();
  root.name = `ocean-dolphin-${index}`;
  const gray = [0x80aebd, 0x709cab, 0x93b8c2][index];
  const add = (shape, color, p, s, r, group = root) => resources.mesh(group, shape, color, p, s, r);
  add("round", gray, [0, 0, 0], [0.46, 0.42, 1.2]);
  add("round", 0xe0ece2, [0, -0.19, 0.15], [0.39, 0.23, 0.96]);
  add("round", gray, [0, 0.03, 1.08], [0.25, 0.19, 0.6]);
  add("dorsal", gray, [0, 0.3, -0.2], [1, 0.72, 0.9]);
  for (const side of [-1, 1]) {
    add(
      "round",
      gray,
      [side * 0.56, -0.18, 0.28],
      [0.55, 0.065, 0.2],
      [0, side * 0.45, side * -0.18],
    );
    add("round", 0x152f39, [side * 0.28, 0.12, 0.97], [0.045, 0.045, 0.045]);
    add("round", 0xf5f6e8, [side * 0.305, 0.13, 0.985], [0.016, 0.016, 0.016]);
  }
  const tail = new THREE.Group();
  tail.position.z = -1.2;
  root.add(tail);
  add("round", gray, [0, 0, -0.12], [0.16, 0.16, 0.5], undefined, tail);
  for (const side of [-1, 1]) {
    add("round", gray, [side * 0.36, 0, -0.52], [0.5, 0.065, 0.25], [0, side * -0.3, 0], tail);
  }
  return { root, tail };
}

export function createDolphins(context, group, resources, habitat) {
  const lagoon = OCEAN_PLACES.find((place) => place.id === "lagoon");
  const reef = OCEAN_PLACES.find((place) => place.id === "reef");
  const actors = Array.from({ length: 3 }, (_, index) => ({
    ...model(resources, index),
    index,
    mode: "roam",
    age: 0,
    cooldown: 20 + index * 9,
    heading: 0,
    breach: 0,
    nextBreach: 12 + index * 8,
    rippleTime: 0,
    target: new THREE.Vector3(),
    start: new THREE.Vector3(),
  }));
  for (const actor of actors) {
    actor.root.position.set(lagoon.x + actor.index * 2, 0, lagoon.z);
    group.add(actor.root);
  }
  function targetFor(actor, time, player, swimming) {
    actor.age += time;
    actor.cooldown -= time;
    const position = actor.root.position;
    if (
      actor.mode === "roam" &&
      swimming &&
      actor.cooldown <= 0 &&
      position.distanceToSquared(player) < 18 ** 2
    ) {
      actor.mode = "escort";
      actor.age = 0;
    }
    if (actor.mode === "escort" && (!swimming || actor.age > 8)) {
      actor.mode = swimming ? "guide" : "roam";
      actor.age = 0;
      actor.start.copy(position);
      actor.cooldown = 55;
    }
    if (actor.mode === "guide" && actor.age > 18) {
      actor.mode = "roam";
      actor.age = 0;
    }
    if (actor.mode === "escort") {
      const forward = context.player.forward;
      actor.target.set(player.x + (forward?.x ?? 0) * 3 + 3.5, 0, player.z + (forward?.z ?? 1) * 3);
    } else if (actor.mode === "guide") {
      const blend = Math.min(1, actor.age / 13);
      actor.target.set(
        actor.start.x + (reef.x - actor.start.x) * blend,
        0,
        actor.start.z + (reef.z - actor.start.z) * blend,
      );
    } else {
      const phase = actor.age * 0.19 + actor.index * 2.1;
      actor.target.set(
        lagoon.x + Math.cos(phase) * (8 + actor.index),
        0,
        lagoon.z + Math.sin(phase) * (6 + actor.index),
      );
    }
  }
  return {
    update(dt, time) {
      const player = context.player.position;
      const swimming =
        habitat.clear(player.x, player.z, 1) &&
        player.y < context.water.sample(player.x, player.z) + 1.2;
      for (const actor of actors) {
        targetFor(actor, dt, player, swimming);
        const p = actor.root.position;
        const dx = actor.target.x - p.x,
          dz = actor.target.z - p.z;
        const distance = Math.hypot(dx, dz);
        const step = Math.min(distance, dt * (actor.mode === "roam" ? 2.3 : 3.8));
        const x = p.x + (distance ? (dx / distance) * step : 0);
        const z = p.z + (distance ? (dz / distance) * step : 0);
        actor.root.visible = habitat.clear(x, z, 2.3, 1.8);
        if (!actor.root.visible) {
          actor.mode = "roam";
          // Advance the habitat route even if an edited block covers one section.
          if (habitat.clear(actor.target.x, actor.target.z, 2.3, 1.8)) {
            p.x = actor.target.x;
            p.z = actor.target.z;
          }
          continue;
        }
        p.x = x;
        p.z = z;
        if (distance > 0.05) {
          const wanted = Math.atan2(dx, dz);
          actor.heading +=
            Math.atan2(Math.sin(wanted - actor.heading), Math.cos(wanted - actor.heading)) *
            Math.min(1, dt * 3);
        }
        actor.nextBreach -= dt;
        if (actor.nextBreach <= 0 && !actor.breach && actor.mode === "roam") {
          actor.breach = 0.001;
          actor.nextBreach = 25 + actor.index * 7;
          context.water.ripple(x, z, 0.65);
        }
        let height = -0.85,
          pitch = Math.sin(time * 3.5 + actor.index) * 0.06;
        if (actor.breach) {
          actor.breach += dt;
          const phase = Math.min(1, actor.breach / 1.8);
          height += Math.sin(phase * Math.PI) * 2.1;
          pitch = -(1 - phase * 2) * 0.65;
          if (phase === 1) {
            actor.breach = 0;
            context.water.ripple(x, z, 1.2);
          }
        }
        p.y = context.water.sample(x, z) + height;
        actor.root.rotation.set(pitch, actor.heading, 0);
        actor.tail.rotation.x = Math.sin(time * 4.8 + actor.index) * 0.22;
        actor.rippleTime -= dt;
        if (actor.rippleTime <= 0 && height > -0.5) {
          context.water.ripple(x, z, 0.18);
          actor.rippleTime = 0.8;
        }
      }
    },
  };
}
