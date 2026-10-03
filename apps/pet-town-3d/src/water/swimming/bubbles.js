import * as THREE from "three";

export function createSwimmingBubbles(context) {
  const count = 24;
  const positions = new Float32Array(count * 3);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({
    color: 0xc5eee9,
    size: 0.06,
    transparent: true,
    opacity: 0.45,
    depthWrite: false,
  });
  const bubbles = new THREE.Points(geometry, material);
  bubbles.name = "water-swim-bubbles";
  bubbles.frustumCulled = false;
  context.scene.add(bubbles);
  let time = 0;
  return {
    update(dt) {
      time += dt;
      const p = context.player.position;
      const surface = context.water.sample(p.x, p.z);
      bubbles.visible = context.player.body.swimming && p.y + 1.2 < surface;
      if (!bubbles.visible) return;
      for (let i = 0; i < count; i++) {
        const phase = (time * 0.6 + i / count) % 1;
        positions[i * 3] = p.x + Math.sin(i * 2.4 + time) * (0.15 + phase * 0.3);
        positions[i * 3 + 1] = Math.min(surface - 0.1, p.y + 0.65 + phase * 1.8);
        positions[i * 3 + 2] = p.z + Math.cos(i * 2.4 + time) * (0.15 + phase * 0.3);
      }
      geometry.attributes.position.needsUpdate = true;
    },
    dispose() {
      bubbles.removeFromParent();
      geometry.dispose();
      material.dispose();
    },
  };
}
