import * as THREE from "three";
import { createActivityModel } from "./model-kit.js";
import { FISHING_SHORE, FISHING_BOBBER, FISH_SPECIES } from "./places.js";

export function createFishingModel(context) {
  const model = createActivityModel(context, "Willowmere fishing rod and bobber");
  const { x, z } = FISHING_SHORE;
  const rod = model.mesh(new THREE.CylinderGeometry(0.028, 0.065, 2.8, 7), 0xa47744);
  rod.rotation.x = -0.28;
  const handle = model.mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.48, 7), 0x6d5142);
  const reel = model.mesh(new THREE.TorusGeometry(0.12, 0.035, 6, 12), 0xc4c0ae);
  const bobber = model.mesh(new THREE.SphereGeometry(0.16, 10, 8), 0xf29978, model.root, true);
  const cap = model.mesh(new THREE.SphereGeometry(0.09, 8, 6), 0xfff0cb, bobber);
  cap.position.y = 0.12;
  const ripple = model.mesh(new THREE.TorusGeometry(0.4, 0.025, 6, 24), 0xf5db91, model.root, true);
  ripple.rotation.x = Math.PI / 2;
  const line = model.line(0xe4dcc2);
  const fish = FISH_SPECIES.map((name, index) => {
    const group = new THREE.Group();
    group.name = name;
    model.root.add(group);
    const body = model.mesh(
      new THREE.SphereGeometry(0.22, 12, 8),
      [0xa5c3b2, 0xc3d6dc, 0xf0ba67][index],
      group,
    );
    body.scale.set(1.8, 0.75, 0.55);
    const tail = model.mesh(new THREE.ConeGeometry(0.16, 0.23, 3), 0xd8ad70, group);
    tail.rotation.z = -Math.PI / 2;
    tail.position.x = -0.4;
    const eye = model.mesh(new THREE.SphereGeometry(0.035, 6, 6), 0x404d45, group);
    eye.position.set(0.24, 0.03, 0.12);
    return group;
  });
  return {
    update(support, phase, catchName) {
      model.root.visible = Boolean(support);
      if (!support) return;
      rod.position.set(x - 0.4, support.shore + 1.36, z - 0.35);
      handle.position.set(x - 0.4, support.shore + 0.25, z);
      reel.position.set(x - 0.4, support.shore + 0.55, z + 0.08);
      const cast = phase === "waiting" || phase === "nibble";
      bobber.visible = line.visible = cast;
      ripple.visible = phase === "nibble";
      const wave = context.water?.sample?.(FISHING_BOBBER.x, FISHING_BOBBER.z) ?? support.water;
      const dip =
        phase === "nibble"
          ? Math.sin(context.time * 12) * 0.16 - 0.06
          : Math.sin(context.time * 2) * 0.03;
      bobber.position.set(FISHING_BOBBER.x, wave + 0.05 + dip, FISHING_BOBBER.z);
      ripple.position.set(FISHING_BOBBER.x, wave + 0.045, FISHING_BOBBER.z);
      ripple.scale.setScalar(1 + (Math.sin(context.time * 6) + 1) * 0.35);
      if (cast)
        model.setLine(line, [
          [x - 0.4, support.shore + 2.7, z - 0.75],
          [x - 0.2, wave + 0.35, z - 4],
          bobber.position.toArray(),
        ]);
      for (let index = 0; index < fish.length; index++) {
        fish[index].visible = phase === "caught" && FISH_SPECIES[index] === catchName;
        fish[index].position.set(x + 0.5, support.shore + 1.25, z - 0.5);
        fish[index].rotation.z = Math.sin(context.time * 3) * 0.08;
      }
    },
    dispose: model.dispose,
  };
}
