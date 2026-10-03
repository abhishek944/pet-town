import * as THREE from "three";

/** Each activity owns all created GPU resources, including its replaceable line. */
export function createActivityModel(context, name) {
  const root = new THREE.Group();
  root.name = name;
  root.visible = false;
  const materials = new Map();
  function material(color, glow = false) {
    const key = `${color}:${glow}`;
    if (!materials.has(key))
      materials.set(
        key,
        new THREE.MeshStandardMaterial({
          color,
          roughness: 0.85,
          emissive: glow ? color : 0,
          emissiveIntensity: glow ? 0.55 : 0,
        }),
      );
    return materials.get(key);
  }
  function mesh(geometry, color, parent = root, glow = false) {
    const item = new THREE.Mesh(geometry, material(color, glow));
    item.castShadow = item.receiveShadow = true;
    parent.add(item);
    return item;
  }
  function line(color) {
    const item = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color }));
    root.add(item);
    return item;
  }
  function setLine(item, points) {
    const position = item.geometry.getAttribute("position");
    if (position?.count === points.length) {
      points.forEach((point, index) => position.setXYZ(index, ...point));
      position.needsUpdate = true;
      item.geometry.computeBoundingSphere();
    } else {
      item.geometry.dispose();
      item.geometry = new THREE.BufferGeometry().setFromPoints(
        points.map((point) => new THREE.Vector3(...point)),
      );
    }
  }
  context.scene.add(root);
  return {
    root,
    mesh,
    line,
    setLine,
    dispose() {
      root.removeFromParent();
      const ownedMaterials = new Set(materials.values());
      root.traverse((item) => {
        item.geometry?.dispose();
        if (item.isLight) item.dispose?.();
        if (item.material) ownedMaterials.add(item.material);
      });
      for (const item of ownedMaterials) item.dispose();
    },
  };
}
