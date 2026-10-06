import * as THREE from "three";
import { OCEAN_PLACES } from "../layout.js";
import { createReefFishMaterial, createReefFishModel, FISH_SCHOOLS } from "./fish-model.js";

/** Three batches per school keep 54 marked, animated fish to nine draw calls. */
export function createFishSchools(context, group, _resources, habitat) {
  const material = createReefFishMaterial();
  const models = FISH_SCHOOLS.map(({ id }) => createReefFishModel(id, material));
  for (const model of models) model.updateMatrixWorld(true);
  const pose = new THREE.Object3D();
  const transform = new THREE.Matrix4();
  const swing = new THREE.Matrix4();
  const schools = FISH_SCHOOLS.map((definition, index) => {
    const place = OCEAN_PLACES.find((entry) => entry.id === definition.place);
    const parts = models[index].children.map((source) => {
      const mesh = new THREE.InstancedMesh(source.geometry, material, definition.count);
      mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      mesh.frustumCulled = false;
      mesh.name = `ocean-${definition.place}-fish-${index}-${source.name}`;
      group.add(mesh);
      return { mesh, local: source.matrixWorld.clone(), animation: source.name };
    });
    return { ...definition, place, parts, index };
  });
  function set(part, index, x, y, z, yaw, size, phase, time) {
    pose.position.set(x, y, z);
    pose.rotation.set(0, yaw, 0);
    pose.scale.setScalar(size);
    pose.updateMatrix();
    transform.multiplyMatrices(pose.matrix, part.local);
    if (part.animation === "Tail") {
      swing.makeRotationY(Math.sin(time * 7 + phase) * 0.17);
      transform.multiply(swing);
    } else if (part.animation === "PectoralFins") {
      swing.makeRotationZ(Math.sin(time * 4.5 + phase) * 0.07);
      transform.multiply(swing);
    }
    part.mesh.setMatrixAt(index, transform);
  }
  return {
    update(_dt, time) {
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
          for (const part of school.parts)
            set(part, index, x, y, z, yaw, size, phase + index, time);
        }
        for (const part of school.parts) part.mesh.instanceMatrix.needsUpdate = true;
      }
    },
    dispose() {
      for (const school of schools) for (const part of school.parts) part.mesh.dispose();
      for (const model of models) for (const part of model.children) part.geometry.dispose();
      material.dispose();
    },
  };
}
