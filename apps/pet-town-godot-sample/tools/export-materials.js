import * as THREE from "../../pet-town-3d/node_modules/three/build/three.module.js";

// Rebuild plain glTF-compatible materials: source userData contains runtime cycles.
export function exportMaterial(source, tint) {
  if (Array.isArray(source)) return source.map((value) => exportMaterial(value, tint));
  const material = source.isMeshBasicMaterial
    ? new THREE.MeshBasicMaterial()
    : new THREE.MeshStandardMaterial({ roughness: source.roughness ?? 0.88 });
  for (const key of ["color", "emissive"]) {
    if (material[key] && source[key]) material[key].copy(source[key]);
  }
  for (const key of [
    "map",
    "normalMap",
    "roughnessMap",
    "metalnessMap",
    "alphaMap",
    "transparent",
    "opacity",
    "alphaTest",
    "side",
    "vertexColors",
    "depthWrite",
  ])
    if (source[key] !== undefined) material[key] = source[key];
  if (source.metalness !== undefined) material.metalness = source.metalness;
  if (tint) material.color.multiply(tint);
  material.name = source.name || "Original town material";
  return material;
}

export function cloneExportTree(source, names = new Map()) {
  if (!source.visible) return null;
  const copy = source.isMesh
    ? new THREE.Mesh(source.geometry, exportMaterial(source.material))
    : new THREE.Group();
  copy.name = source.name;
  copy.position.copy(source.position);
  copy.quaternion.copy(source.quaternion);
  copy.scale.copy(source.scale);
  names.set(source, copy);
  for (const child of source.children) {
    const childCopy = cloneExportTree(child, names);
    if (childCopy) copy.add(childCopy);
  }
  return copy;
}

export function rangeGeometry(source, start, count) {
  const geometry = new THREE.BufferGeometry();
  const attributes = ["position", "normal", "uv", "color"];
  for (const name of attributes) {
    const attribute = source.getAttribute(name);
    if (!attribute) continue;
    const values = new Float32Array(count * attribute.itemSize);
    for (let i = 0; i < count; i++) {
      const vertex = source.index ? source.index.getX(start + i) : start + i;
      for (let c = 0; c < attribute.itemSize; c++)
        values[i * attribute.itemSize + c] = attribute.getComponent(vertex, c);
    }
    geometry.setAttribute(name, new THREE.BufferAttribute(values, attribute.itemSize));
  }
  return geometry;
}
