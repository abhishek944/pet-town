import * as THREE from "three";
import { OCEAN_PLACES } from "../layout.js";

/** Instancing keeps 54 individually animated fish to 15 draw calls. */
export function createFishSchools(context, group, resources, habitat) {
  const definitions = [
    { place: "reef", color: 0xf3b354, fin: 0xe76f61, count: 18, radius: 6, speed: 0.23, depth: 2 },
    {
      place: "reef",
      color: 0x54c6d3,
      fin: 0x337eae,
      count: 18,
      radius: 9,
      speed: -0.16,
      depth: 3.4,
    },
    {
      place: "kelp",
      color: 0xb5d992,
      fin: 0x5baf96,
      count: 18,
      radius: 7,
      speed: 0.19,
      depth: 2.8,
    },
  ];
  const pose = new THREE.Object3D();
  const schools = definitions.map((definition, index) => {
    const place = OCEAN_PLACES.find((entry) => entry.id === definition.place);
    const parts = [
      ["round", definition.color, 1],
      ["tail", definition.fin, 1],
      ["dorsal", definition.fin, 1],
      ["round", 0x173a40, 2],
      ["round", 0xf4eaca, 1],
    ].map(([shape, color, multiplier]) => {
      const mesh = new THREE.InstancedMesh(
        resources.geometries[shape],
        resources.material(color),
        definition.count * multiplier,
      );
      mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      mesh.frustumCulled = false;
      mesh.name = `ocean-${definition.place}-fish-${index}`;
      group.add(mesh);
      return mesh;
    });
    return { ...definition, place, parts, index };
  });
  function matrix(mesh, index, x, y, z, yaw, sx, sy, sz) {
    pose.position.set(x, y, z);
    pose.rotation.set(0, yaw, 0);
    pose.scale.set(sx, sy, sz);
    pose.updateMatrix();
    mesh.setMatrixAt(index, pose.matrix);
  }
  return {
    update(dt, time) {
      for (const school of schools) {
        for (let index = 0; index < school.count; index++) {
          const phase = time * school.speed + school.index * 1.7 + index * 0.17;
          const radius = school.radius + Math.sin(index * 2.7) * 1.4;
          const x = school.place.x + Math.cos(phase) * radius;
          const z = school.place.z + Math.sin(phase) * radius * 0.7;
          const depth = habitat.depth(x, z);
          const size = depth > 1.6 && habitat.clear(x, z, 1.6, 0.65) ? 0.8 + (index % 4) * 0.07 : 0;
          const y =
            context.water.sample(x, z) -
            Math.min(depth - 0.7, school.depth + Math.sin(time * 0.8 + index * 0.7) * 0.35);
          const yaw = Math.atan2(
            -Math.sin(phase) * Math.sign(school.speed),
            Math.cos(phase) * 0.7 * Math.sign(school.speed),
          );
          const fx = Math.sin(yaw),
            fz = Math.cos(yaw);
          const sideX = Math.cos(yaw),
            sideZ = -Math.sin(yaw);
          const [body, tail, dorsal, eyes, belly] = school.parts;
          matrix(body, index, x, y, z, yaw, 0.12 * size, 0.21 * size, 0.48 * size);
          matrix(
            tail,
            index,
            x - fx * 0.52 * size,
            y,
            z - fz * 0.52 * size,
            yaw + Math.sin(time * 7 + index) * 0.35,
            size * 0.55,
            size * 0.6,
            size * 0.6,
          );
          matrix(dorsal, index, x, y + 0.12 * size, z, yaw, size * 0.5, size * 0.3, size * 0.6);
          matrix(belly, index, x, y - 0.11 * size, z, yaw, 0.108 * size, 0.075 * size, 0.36 * size);
          for (let eye = 0; eye < 2; eye++) {
            const side = eye ? 1 : -1;
            matrix(
              eyes,
              index * 2 + eye,
              x + fx * 0.27 * size + sideX * side * 0.103 * size,
              y + 0.06 * size,
              z + fz * 0.27 * size + sideZ * side * 0.103 * size,
              yaw,
              0.035 * size,
              0.035 * size,
              0.035 * size,
            );
          }
        }
        for (const mesh of school.parts) mesh.instanceMatrix.needsUpdate = true;
      }
    },
    dispose() {
      for (const school of schools) for (const mesh of school.parts) mesh.dispose();
    },
  };
}
