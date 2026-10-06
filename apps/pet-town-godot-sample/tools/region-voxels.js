import * as THREE from "../../pet-town-3d/node_modules/three/build/three.module.js";
import { json, packed } from "./region-data.js";
export async function exportVoxels(ctx, manifest) {
  const b = manifest.bounds;
  const width = b.maxX - b.minX,
    depth = b.maxZ - b.minZ,
    height = ctx.terrain.height;
  const cells = new Uint8Array(width * depth * height);
  for (let z = 0; z < depth; z++)
    for (let x = 0; x < width; x++)
      for (let y = 0; y < height; y++)
        cells[(z * width + x) * height + y] = ctx.terrain.blockAt(b.minX + x, y, b.minZ + z);
  const file = "region-voxels.json";
  await json(file, {
    width,
    depth,
    height,
    bounds: b,
    order: "(localZ * width + localX) * height + y",
    cells: packed(new THREE.BufferAttribute(cells, 1)),
  });
  manifest.voxels = {
    file,
    width,
    depth,
    height,
    order: "(localZ * width + localX) * height + y",
    blockIds: ctx.terrain.BLOCK,
    definitions: ctx.terrain.blocks,
  };
}
