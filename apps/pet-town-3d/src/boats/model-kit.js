import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

/** One coloured mesh keeps moving boat camera queries inexpensive. */
export function createBoatModelKit(name) {
  const parts = [];
  function add(geometry, color, position = [0, 0, 0], rotation = [0, 0, 0], scale) {
    const matrix = new THREE.Matrix4().compose(
      new THREE.Vector3(...position),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(...rotation)),
      new THREE.Vector3(...(scale ?? [1, 1, 1])),
    );
    geometry.applyMatrix4(matrix);
    const flat = geometry.index ? geometry.toNonIndexed() : geometry;
    if (flat !== geometry) geometry.dispose();
    const rgb = new THREE.Color(color);
    const colors = new Float32Array(flat.attributes.position.count * 3);
    for (let i = 0; i < colors.length; i += 3) colors.set([rgb.r, rgb.g, rgb.b], i);
    flat.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    flat.deleteAttribute("uv");
    parts.push(flat);
  }
  const box = (size, color, p, r) => add(new THREE.BoxGeometry(...size), color, p, r);
  const pole = (radius, height, color, p, r) =>
    add(new THREE.CylinderGeometry(radius, radius, height, 12), color, p, r);
  const rope = (points, color = 0xead7aa, radius = 0.045) =>
    add(
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p))),
        32,
        radius,
        8,
        false,
      ),
      color,
    );
  return {
    add,
    box,
    pole,
    rope,
    finish() {
      const geometry = mergeGeometries(parts);
      parts.forEach((part) => part.dispose());
      const material = new THREE.MeshStandardMaterial({
        vertexColors: true,
        roughness: 0.78,
        side: THREE.DoubleSide,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.name = name;
      mesh.castShadow = mesh.receiveShadow = true;
      return mesh;
    },
  };
}

export function disposeBoatModel(root) {
  root.traverse((mesh) => {
    if (!mesh.isMesh) return;
    mesh.geometry.dispose();
    for (const material of [].concat(mesh.material)) material.dispose();
  });
  root.removeFromParent();
}
