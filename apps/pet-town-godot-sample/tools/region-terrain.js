import { terrainState } from '../../pet-town-3d/src/terrain/state.js';
import { boundsOf, inside, json, packed, png, uniforms } from './region-data.js';

export async function exportTerrain(ctx, manifest, report) {
  const atlas = ctx.terrain.atlas;
  manifest.terrain = { chunks: [], layers: [], layerIds: terrainState.terrainTextureLayerIds,
    uniforms: uniforms(ctx.terrain.material.userData.uniforms),
    bump: atlas.bump, seam: atlas.seam, emit: atlas.emit,
    encoding: 'Original typed arrays, little-endian base64; normalized semantics as Three BufferAttribute',
    shader: { aUv: 'local face UV normalized; texture UV=(parity+aUv)*0.5',
      aData: 'bytes: tile,overlay(255=none),ambientOcclusion, direction+parityX*8+parityY*16',
      aTint: 'normalized RGBA: RGB*2 tint, A bevel',
      aGrass: 'bytes: RGB/127.5 grass tint (R also wall moss amount), A edge flags',
      direction: '0/1 x sides;2 top;3 bottom;4/5 z sides',
      textureOrientation: 'PNG rows match original DataArrayTexture bytes; use UV without extra flip' } };
  const texture = atlas.texture.image;
  for (let layer = 0; layer < atlas.count; layer++) {
    const canvas = document.createElement('canvas');
    canvas.width = texture.width; canvas.height = texture.height;
    const length = texture.width * texture.height * 4;
    const pixels = new Uint8ClampedArray(atlas.data.slice(layer * length, (layer + 1) * length));
    canvas.getContext('2d').putImageData(new ImageData(pixels, texture.width, texture.height), 0, 0);
    const file = `region-terrain-layer-${layer}.png`;
    await png(file, canvas);
    manifest.terrain.layers.push({ layer, file, overlay: atlas.layers[layer]?.isOverlay ?? false });
  }
  ctx.terrain.group.updateMatrixWorld(true);
  for (const mesh of ctx.terrain.group.children) {
    if (!mesh.visible || !mesh.geometry?.getAttribute('position')?.count) continue;
    const b = boundsOf(mesh), r = manifest.bounds;
    if (b.max.x <= r.minX || b.min.x >= r.maxX || b.max.z <= r.minZ || b.min.z >= r.maxZ) continue;
    const attributes = {};
    for (const [name, value] of Object.entries(mesh.geometry.attributes)) attributes[name] = packed(value);
    const file = `region-terrain-${mesh.name.replaceAll('_', '-')}.json`;
    report(`Original terrain ${mesh.name}`);
    await json(file, { attributes, index: packed(mesh.geometry.index), matrix: mesh.matrixWorld.toArray() });
    manifest.terrain.chunks.push({ file, name: mesh.name, lip: mesh.name.startsWith('lip_'),
      vertexCount: mesh.geometry.attributes.position.count,
      triangles: mesh.geometry.index.count / 3 });
  }
  await json(manifest.groundFile, { columns: ['x', 'y', 'z', 'water'], cells: manifest.ground });
  delete manifest.ground;
}
