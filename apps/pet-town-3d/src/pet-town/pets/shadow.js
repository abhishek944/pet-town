import {
  DataTexture,
  LinearFilter,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  RGBAFormat,
} from "three";

export function createPetShadow() {
  const size = 32;
  const data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const r = Math.hypot(((x + 0.5) / size) * 2 - 1, ((y + 0.5) / size) * 2 - 1);
      const offset = (y * size + x) * 4;
      data.set([255, 255, 255, Math.round(Math.max(0, 1 - r) ** 1.6 * 255)], offset);
    }
  const map = new DataTexture(data, size, size, RGBAFormat);
  map.minFilter = map.magFilter = LinearFilter;
  map.needsUpdate = true;
  const material = new MeshBasicMaterial({
    map,
    color: 0x1d2420,
    transparent: true,
    opacity: 0.44,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -2,
  });
  const shadow = new Mesh(new PlaneGeometry(1, 1).rotateX(-Math.PI / 2), material);
  shadow.name = "pet-shadow";
  shadow.renderOrder = 2;
  return shadow;
}
