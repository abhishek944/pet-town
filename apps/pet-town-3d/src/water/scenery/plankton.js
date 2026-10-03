import * as THREE from "three";

/** Forty reusable points; movement and light fade drive a quiet swimming halo. */
export function createPlankton(context, parent) {
  const count = 40;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  const material = new THREE.PointsMaterial({
    color: 0x87ffe2,
    size: 0.055,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true,
    vertexColors: true,
  });
  const points = new THREE.Points(geometry, material);
  points.name = "Night swimming plankton";
  points.frustumCulled = false;
  parent.add(points);
  let time = 0;
  return {
    update(dt) {
      time += dt;
      const position = context.player?.position;
      const water = context.water;
      const night = context.sky?.nightFactor ?? context.lightState?.nightFactor ?? 0;
      const immersed =
        position &&
        water?.isWater(position.x, position.z) &&
        position.y < water.sample(position.x, position.z) + 0.45;
      points.visible = !!immersed && night > 0.2;
      if (!points.visible) return;
      points.position.copy(position);
      material.opacity = Math.min(0.85, (night - 0.2) * 1.1);
      for (let i = 0; i < count; i++) {
        const angle = i * 2.39996 + time * 0.1;
        const radius = 0.45 + (i % 7) * 0.18;
        const dx = Math.cos(angle) * radius;
        const dz = Math.sin(angle) * radius;
        const x = position.x + dx;
        const z = position.z + dz;
        const surface = water.sample(x, z);
        const floor = context.terrain.topY(x, z);
        const bright = water.isWater(x, z) && surface - floor > 0.25 ? 1 : 0;
        const y = Math.max(
          floor + 0.15,
          Math.min(surface - 0.06, position.y + Math.sin(time * 0.7 + i) * 0.65),
        );
        positions[i * 3] = dx;
        positions[i * 3 + 1] = y - position.y;
        positions[i * 3 + 2] = dz;
        colors.fill(bright, i * 3, i * 3 + 3);
      }
      geometry.attributes.position.needsUpdate = true;
      geometry.attributes.color.needsUpdate = true;
    },
    dispose() {
      points.removeFromParent();
      geometry.dispose();
      material.dispose();
    },
  };
}
