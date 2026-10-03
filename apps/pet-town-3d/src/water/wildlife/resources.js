import * as THREE from "three";

/** Wildlife shares a small resource pool, disposed only by its owning system. */
export function createMarineResources() {
  const geometries = {
    round: new THREE.SphereGeometry(1, 10, 6),
    box: new THREE.BoxGeometry(1, 1, 1),
    pole: new THREE.CylinderGeometry(1, 1, 1, 6),
    tail: triangle([0, 0.55, -0.45, 0, -0.55, -0.45, 0, 0, 0.25]),
    dorsal: triangle([0, 0, -0.5, 0, 0.85, -0.45, 0, 0, 0.5]),
    sail: triangle([0, 0, 0, 0, 6, 0, 0, 0, 4.2]),
  };
  const materials = new Map();
  function material(color) {
    if (!materials.has(color))
      materials.set(
        color,
        new THREE.MeshStandardMaterial({
          color,
          roughness: 0.8,
          flatShading: true,
          side: THREE.DoubleSide,
        }),
      );
    return materials.get(color);
  }
  function mesh(parent, shape, color, position, scale, rotation) {
    const part = new THREE.Mesh(geometries[shape], material(color));
    part.position.set(...position);
    part.scale.set(...scale);
    if (rotation) part.rotation.set(...rotation);
    parent.add(part);
    return part;
  }
  return {
    geometries,
    material,
    mesh,
    dispose() {
      for (const geometry of Object.values(geometries)) geometry.dispose();
      for (const item of materials.values()) item.dispose();
    },
  };
}

function triangle(vertices) {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  geometry.computeVertexNormals();
  return geometry;
}
