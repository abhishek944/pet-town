import * as THREE from "three";
import { createActivityModel } from "./model-kit.js";
import { WISH_POSTS, WISH_CHOICES } from "./places.js";

export function createWishLanternModel(context) {
  const model = createActivityModel(context, "Willowmere wish lanterns");
  const posts = WISH_POSTS.map(() =>
    model.mesh(new THREE.CylinderGeometry(0.08, 0.12, 3.3, 8), 0x876342),
  );
  const rope = model.line(0xae8c61);
  const lanterns = Array.from({ length: 8 }, (_, index) => {
    const group = new THREE.Group();
    model.root.add(group);
    const variants = WISH_CHOICES.map((wish, wishIndex) => {
      const item = model.mesh(
        new THREE.CylinderGeometry(0.16, 0.13, 0.34, 10),
        [0xffd58a, 0xf3b88d, 0xffebbc][wishIndex],
        group,
        true,
      );
      item.name = `${wish} lantern ${index + 1}`;
      return item;
    });
    for (const y of [-0.18, 0.18]) {
      const rim = model.mesh(new THREE.TorusGeometry(0.145, 0.02, 6, 10), 0x95714c, group);
      rim.rotation.x = Math.PI / 2;
      rim.position.y = y;
    }
    const loop = model.mesh(new THREE.TorusGeometry(0.055, 0.014, 6, 10), 0x997955, group);
    loop.position.y = 0.25;
    return { group, variants };
  });
  const glow = new THREE.PointLight(0xffc780, 1.3, 8, 2);
  model.root.add(glow);
  return {
    update(heights, wishes) {
      model.root.visible = Boolean(heights);
      if (!heights) return;
      posts.forEach((post, index) =>
        post.position.set(WISH_POSTS[index].x, heights[index] + 1.65, WISH_POSTS[index].z),
      );
      const points = [
        [-50, heights[0] + 3.2, -67],
        [-48, (heights[0] + heights[1]) / 2 + 2.8, -67],
        [-46, heights[1] + 3.2, -67],
      ];
      model.setLine(rope, points);
      lanterns.forEach(({ group, variants }, index) => {
        group.visible = index < wishes.length;
        const t = (index + 0.5) / 8;
        const y = heights[0] * (1 - t) + heights[1] * t + 3.2 - Math.sin(t * Math.PI) * 0.4;
        group.position.set(-50 + t * 4, y - 0.26, -67);
        group.rotation.z = Math.sin(context.time * 0.8 + index) * 0.05;
        variants.forEach((item, choice) => {
          item.visible = WISH_CHOICES[choice] === wishes[index];
        });
      });
      glow.position.set(-48, (heights[0] + heights[1]) / 2 + 2, -67);
      glow.visible = wishes.length > 0;
    },
    dispose: model.dispose,
  };
}
