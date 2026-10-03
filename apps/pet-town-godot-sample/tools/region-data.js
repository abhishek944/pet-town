import * as THREE from '../../pet-town-3d/node_modules/three/build/three.module.js';
import { GLTFExporter } from '../../pet-town-3d/node_modules/three/examples/jsm/exporters/GLTFExporter.js';

export const inside = (b, x, z) => x >= b.minX && x < b.maxX && z >= b.minZ && z < b.maxZ;
export async function post(name, data, type = 'application/octet-stream') {
  const body = type === 'application/json' ? JSON.stringify(data) : data;
  const reply = await fetch(`http://127.0.0.1:1427/asset/${name}`, {
    method: 'POST', headers: { 'Content-Type': type }, body,
  });
  if (!reply.ok) throw new Error(`${name}: ${reply.status}`);
}
export const json = (name, data) => post(name, data, 'application/json');
export async function glb(name, root) {
  root.updateMatrixWorld(true);
  const data = await new GLTFExporter().parseAsync(root, {
    binary: true, onlyVisible: false, maxTextureSize: 1024,
  });
  await post(name, data);
  return { file: name, bytes: data.byteLength };
}
export async function png(name, canvas) {
  const data = await new Promise((resolve) => canvas.toBlob(resolve));
  await post(name, data, 'image/png');
}
export function packed(attribute) {
  const array = attribute.array;
  const bytes = new Uint8Array(array.buffer, array.byteOffset, array.byteLength);
  let encoded = '';
  for (let i = 0; i < bytes.length; i += 16384)
    encoded += String.fromCharCode(...bytes.subarray(i, i + 16384));
  return { type: array.constructor.name, itemSize: attribute.itemSize,
    normalized: attribute.normalized, count: attribute.count, base64: btoa(encoded) };
}
export function uniforms(source) {
  const result = {};
  for (const [key, entry] of Object.entries(source ?? {})) {
    const value = entry?.value;
    if (typeof value === 'number' || typeof value === 'boolean') result[key] = value;
    else if (value?.isColor || value?.isVector2 || value?.isVector3 || value?.isVector4)
      result[key] = value.toArray();
  }
  return result;
}
export function boundsOf(mesh) {
  return new THREE.Box3().setFromObject(mesh);
}
