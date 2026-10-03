import { png, uniforms } from './region-data.js';
export async function exportEnvironment(ctx, manifest) {
  const r = manifest.bounds;
  const width = r.maxX - r.minX, height = r.maxZ - r.minZ;
  const canvas = document.createElement('canvas');
  canvas.width = width; canvas.height = height;
  const pixels = new Uint8ClampedArray(width * height * 4);
  for (let z = 0; z < height; z++) for (let x = 0; x < width; x++) {
    const y = ctx.terrain.topY(r.minX + x + 0.5, r.minZ + z + 0.5);
    const offset = (z * width + x) * 4;
    pixels[offset] = Math.max(0, Math.min(255, (manifest.waterLevel - y) / 16 * 255));
    pixels[offset + 1] = ctx.terrain.isWater(r.minX + x + 0.5, r.minZ + z + 0.5) ? 255 : 0;
    pixels[offset + 2] = Math.max(0, Math.min(255, y / 40 * 255));
    pixels[offset + 3] = 255;
  }
  canvas.getContext('2d').putImageData(new ImageData(pixels, width, height), 0, 0);
  await png('region-water-fields.png', canvas);
  manifest.water = { file: 'region-water-fields.png', bounds: r, width, height,
    depthScale: 16, heightScale: 40, waterLevel: manifest.waterLevel,
    channels: 'R depth/16; G water mask; B ground height/40; A1. PNG top row=minZ. Linear data.' };
  const lights = [];
  ctx.scene.traverse((item) => {
    if (item.isLight) lights.push({ name: item.name, type: item.type,
      color: item.color.toArray(), intensity: item.intensity, position: item.position.toArray(),
      groundColor: item.groundColor?.toArray(), distance: item.distance });
  });
  manifest.environment = { timeOfDay: ctx.timeOfDay, sky: uniforms(ctx.sky?.uniforms), lights,
    horizonColor: ctx.sky?.horizonColor?.toArray(), sunDir: ctx.sky?.sunDir?.toArray(),
    fog: { color: ctx.scene.fog?.color?.toArray(), near: ctx.scene.fog?.near, far: ctx.scene.fog?.far },
    exposure: ctx.renderer.toneMappingExposure, toneMapping: ctx.renderer.toneMapping,
    camera: { position: ctx.camera.position.toArray(), quaternion: ctx.camera.quaternion.toArray(),
      fov: ctx.camera.fov, near: ctx.camera.near, far: ctx.camera.far } };
}
