import * as THREE from "three";
import { GARDEN_POSITION } from "./places.js";
import { getGardenSupport } from "./garden-support.js";

/** Six hand-positioned flowers are the visible result of the garden activity. */
export function createSunmeadowGarden(context) {
  const root = new THREE.Group();
  root.name = "Sunmeadow planted garden";
  const flowers = new THREE.Group();
  const materials = new Map();
  function material(color) {
    if (!materials.has(color))
      materials.set(color, new THREE.MeshStandardMaterial({ color, roughness: 0.9 }));
    return materials.get(color);
  }
  function mesh(group, geometry, color, x, y, z) {
    const item = new THREE.Mesh(geometry, material(color));
    item.position.set(x, y, z);
    item.castShadow = item.receiveShadow = true;
    group.add(item);
    return item;
  }
  function box(w, h, d, color, x, y, z) {
    return mesh(root, new THREE.BoxGeometry(w, h, d), color, x, y, z);
  }
  box(3, 0.12, 2, 0x704933, 0, 0.07, 0);
  for (const z of [-1, 1]) box(3.2, 0.2, 0.13, 0xc69561, 0, 0.12, z);
  for (const x of [-1.56, 1.56]) box(0.13, 0.2, 2.1, 0xc69561, x, 0.12, 0);
  root.add(flowers);
  const support = getGardenSupport(context.terrain);
  root.position.set(GARDEN_POSITION.x, support ?? 0, GARDEN_POSITION.z);
  root.visible = support !== null;
  context.scene.add(root);
  context.vegetation?.clearArea(GARDEN_POSITION, 2.2, { trees: true, small: true });
  let stage = -1;
  let growth = 1;
  function setStage(next) {
    if (stage === next) return;
    const previous = stage;
    stage = next;
    for (const item of [...flowers.children]) {
      item.traverse((child) => child.geometry?.dispose());
      flowers.remove(item);
    }
    growth = previous < 0 ? 1 : 0.2;
    if (!stage) return;
    const positions = [
      [-1, -0.5],
      [0, -0.5],
      [1, -0.5],
      [-1, 0.5],
      [0, 0.5],
      [1, 0.5],
    ];
    positions.forEach(([x, z], index) => {
      const flower = new THREE.Group();
      flower.position.set(x, 0.14, z);
      flowers.add(flower);
      if (stage === 1) {
        const seed = mesh(flower, new THREE.SphereGeometry(0.09, 8, 6), 0xd3ba78, 0, 0.025, 0);
        seed.scale.y = 0.4;
        return;
      }
      const height = stage === 2 ? 0.28 : 0.65 + (index % 3) * 0.1;
      mesh(flower, new THREE.CylinderGeometry(0.025, 0.032, height, 6), 0x638952, 0, height / 2, 0);
      for (const side of [-1, 1]) {
        const leaf = mesh(
          flower,
          new THREE.SphereGeometry(0.12, 8, 6),
          0x79a855,
          side * 0.09,
          height * 0.42,
          0,
        );
        leaf.scale.set(1, 0.27, 0.5);
        leaf.rotation.z = side * 0.5;
      }
      const color = [0xf28d80, 0xc49ce0, 0xf1c869][index % 3];
      if (stage === 2) {
        mesh(flower, new THREE.SphereGeometry(0.075, 8, 6), color, 0, height, 0);
      } else {
        for (let petal = 0; petal < 5; petal++) {
          const angle = (petal * Math.PI * 2) / 5;
          const item = mesh(
            flower,
            new THREE.SphereGeometry(0.12, 8, 6),
            color,
            Math.cos(angle) * 0.12,
            height + 0.02,
            Math.sin(angle) * 0.12,
          );
          item.scale.y = 0.45;
        }
        mesh(flower, new THREE.SphereGeometry(0.085, 8, 6), 0xffdf8e, 0, height + 0.035, 0);
      }
    });
    flowers.scale.y = growth;
  }
  return {
    setStage,
    update(dt) {
      const top = getGardenSupport(context.terrain);
      root.visible = top !== null;
      if (top !== null) root.position.y = top;
      growth = Math.min(1, growth + dt * 0.8);
      flowers.scale.y = growth;
      for (let index = 0; index < flowers.children.length; index++) {
        flowers.children[index].rotation.z =
          stage > 1 ? Math.sin(context.time * 1.3 + index) * 0.035 : 0;
      }
    },
    dispose() {
      root.removeFromParent();
      root.traverse((item) => item.geometry?.dispose());
      for (const item of materials.values()) item.dispose();
    },
  };
}
