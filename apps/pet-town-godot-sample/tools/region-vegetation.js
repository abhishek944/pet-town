import * as THREE from "../../pet-town-3d/node_modules/three/build/three.module.js";
import { vegetationState } from "../../pet-town-3d/src/vegetation/state.js";
import { inside, json, packed, png, uniforms } from "./region-data.js";

const textureFiles = new Map();
export async function materialData(mat) {
  let map = null;
  if (mat.map?.image) {
    map = textureFiles.get(mat.map.uuid);
    if (!map) {
      map = `region-material-${textureFiles.size}.png`;
      const image = mat.map.image;
      const canvas = document.createElement("canvas");
      canvas.width = image.width;
      canvas.height = image.height;
      const context = canvas.getContext("2d");
      if (image.data)
        context.putImageData(
          new ImageData(new Uint8ClampedArray(image.data), image.width, image.height),
          0,
          0,
        );
      else context.drawImage(image, 0, 0);
      await png(map, canvas);
      textureFiles.set(mat.map.uuid, map);
    }
  }
  return {
    color: mat.color?.toArray() ?? [1, 1, 1],
    emissive: mat.emissive?.toArray(),
    vertexColors: mat.vertexColors,
    opacity: mat.opacity,
    transparent: mat.transparent,
    alphaTest: mat.alphaTest,
    side: mat.side,
    depthWrite: mat.depthWrite,
    map,
    mapFlipY: mat.map?.flipY,
    mapRepeat: mat.map?.repeat?.toArray(),
    defines: mat.defines ?? {},
    uniforms: uniforms(mat.userData?.uniforms),
  };
}
export async function geometryData(file, geo, extra = {}) {
  const attributes = {};
  for (const [name, attribute] of Object.entries(geo.attributes))
    attributes[name] = packed(attribute);
  await json(file, { attributes, index: geo.index ? packed(geo.index) : null, ...extra });
}
export async function exportVegetation(ctx, manifest, report) {
  const runtime = vegetationState.vegetationRuntimeState;
  manifest.vegetation = {
    fields: [],
    instanceCount: 0,
    sharedUniforms: uniforms(runtime.shared),
    encoding:
      "Prototype buffers identical to source. Matrix column-major; color linear RGB. No LOD density thinning baked out.",
  };
  let serial = 0;
  for (const field of Object.values(runtime.fields)) {
    const selected = field.items?.filter(
      (item) => !item.hidden && inside(manifest.bounds, item.x, item.z),
    );
    if (!selected?.length || !field.mat || (!field.geo && !field.variants)) continue;
    const material = await materialData(field.mat);
    const variants = field.variants ?? [[field.geo, ...(field.o.lods ?? []).map((lod) => lod.geo)]];
    for (let variant = 0; variant < variants.length; variant++) {
      const items = selected.filter((item) => (item.v ?? 0) === variant);
      if (!items.length) continue;
      const id = serial++;
      report(`Vegetation ${field.name}/${variant}: ${items.length} original instances`);
      const lods = [];
      for (const [lod, geo] of variants[variant].entries()) {
        if (!geo) continue;
        const file = `region-vegetation-${id}-lod-${lod}.json`;
        await geometryData(file, geo, { material });
        lods.push({
          file,
          vertices: geo.attributes.position.count,
          distance: lod ? (field.o.lodD?.[lod - 1] ?? field.o.lods?.[lod - 1]?.d ?? 30) : 0,
        });
      }
      const instanceFile = `region-instances-${id}.json`;
      const matrices = [],
        colors = [];
      for (const item of items) {
        const matrix = item.m ?? field.matrixOf(item, new THREE.Matrix4()).elements;
        matrices.push(...matrix);
        colors.push(...(item.c ?? item.color?.toArray() ?? [1, 1, 1]));
      }
      await json(instanceFile, {
        count: items.length,
        matrices: packed(new THREE.BufferAttribute(new Float32Array(matrices), 16)),
        colors: packed(new THREE.BufferAttribute(new Float32Array(colors), 3)),
      });
      manifest.vegetation.fields.push({
        id,
        name: field.name,
        variant,
        kind: field.o.kind ?? "small",
        lods,
        instanceFile,
        count: items.length,
        chunk: field.o.chunk ?? 32,
        maxDistance: field.o.maxDist ?? 300,
        castShadow: !!field.o.cast,
        density: field.o.thin ?? null,
        material,
      });
      manifest.vegetation.instanceCount += items.length;
    }
  }
  manifest.trees = ctx.vegetation.trees
    .filter((tree) => inside(manifest.bounds, tree.x, tree.z))
    .map((tree) => ({
      x: tree.x,
      y: tree.y,
      z: tree.z,
      type: tree.type,
      radius: tree.radius,
      height: tree.height,
    }));
  const fields = [];
  for (const field of Object.values(runtime.fields)) {
    const groups = new Map();
    for (const item of field.items ?? []) {
      if (item.hidden || !inside(manifest.bounds, item.x, item.z)) continue;
      const variant = item.v ?? 0;
      if (!groups.has(variant)) groups.set(variant, []);
      groups.get(variant).push([item.x, item.y, item.z, item.rank]);
    }
    for (const [variant, items] of groups)
      fields.push({ name: field.name, variant, items, density: field.o.dens ?? false });
  }
  await json("region-vegetation-ranks.json", {
    fields,
    tier: vegetationState.vegetationQualityTiers[runtime.tierName],
    tierName: runtime.tierName,
  });
  if (runtime.materials.blob.alphaMap?.image)
    await png("region-shadow-mask.png", runtime.materials.blob.alphaMap.image);
}
