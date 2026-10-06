import { propsState } from "../../pet-town-3d/src/props/state.js";
import { cloneExportTree } from "./export-materials.js";
import { glb, inside, json, png, uniforms } from "./region-data.js";
import { selectRegion } from "./region-selection.js";

async function exportTexture(file, texture) {
  const image = texture.image;
  const canvas = document.createElement("canvas");
  canvas.width = image.width;
  canvas.height = image.height;
  const ctx = canvas.getContext("2d");
  if (image.data)
    ctx.putImageData(
      new ImageData(new Uint8ClampedArray(image.data), image.width, image.height),
      0,
      0,
    );
  else ctx.drawImage(image, 0, 0);
  await png(file, canvas);
  return {
    file,
    flipY: texture.flipY,
    repeat: texture.repeat.toArray(),
    offset: texture.offset.toArray(),
    rotation: texture.rotation,
    colorSpace: texture.colorSpace,
    wrapS: texture.wrapS,
    wrapT: texture.wrapT,
  };
}
export async function exportPropDetails(ctx, manifest, report = () => {}) {
  const runtime = propsState.propsRuntime,
    bounds = manifest.bounds;
  const details = {
    version: 1,
    bounds,
    materials: {},
    windmills: [],
    smoke: [],
    lanterns: [],
    meshMaterialRule:
      "Mesh names props_<materialKey>_<rangeIndex>; dynamic sails props_<materialKey>",
    source: "Exact source material values/textures and animated prop locations",
  };
  for (const [key, mat] of Object.entries(runtime.mats)) {
    if (!mat?.isMaterial) continue;
    report(`Prop material ${key}`);
    const record = {
      type: mat.type,
      color: mat.color?.toArray(),
      emissive: mat.emissive?.toArray(),
      emissiveIntensity: mat.emissiveIntensity,
      roughness: mat.roughness,
      metalness: mat.metalness,
      opacity: mat.opacity,
      transparent: mat.transparent,
      side: mat.side,
      depthWrite: mat.depthWrite,
      alphaTest: mat.alphaTest,
      vertexColors: mat.vertexColors,
      bumpScale: mat.bumpScale,
      normalScale: mat.normalScale?.toArray(),
      noShadow: mat.userData.noShadow ?? false,
      defines: mat.defines ?? {},
      uniforms: uniforms(mat.userData.uniforms ?? mat.uniforms),
      maps: {},
    };
    for (const slot of [
      "map",
      "bumpMap",
      "normalMap",
      "emissiveMap",
      "roughnessMap",
      "metalnessMap",
      "alphaMap",
    ]) {
      if (mat[slot]?.image)
        record.maps[slot] = await exportTexture(
          `region-prop-${key.toLowerCase()}-${slot.toLowerCase()}.png`,
          mat[slot],
        );
    }
    details.materials[key] = record;
  }
  runtime.group.updateMatrixWorld(true);
  for (const rotor of runtime.blades) {
    const parent = rotor.parent;
    const position = parent.position;
    if (!inside(bounds, position.x, position.z)) continue;
    const copy = cloneExportTree(rotor);
    copy.name = "OriginalWindmillRotor";
    const file = `region-windmill-${details.windmills.length}.glb`;
    await glb(file, copy);
    details.windmills.push({
      file,
      parentMatrix: parent.matrixWorld.toArray(),
      angularVelocity: [0, 0, -0.42],
      axis: "local Z",
      meshMaterialRule: "props_<materialKey>",
    });
  }
  for (const emitter of runtime.smokes) {
    if (!inside(bounds, emitter.origin.x, emitter.origin.z)) continue;
    details.smoke.push({ origin: emitter.origin.toArray(), particles: emitter.p });
  }
  details.lanterns = runtime.halos.filter((p) => inside(bounds, p.x, p.z)).map((p) => p.toArray());
  details.lightPools = runtime.pools.filter((p) => inside(bounds, p[0], p[2]));
  details.shades = runtime.shade.filter((p) => inside(bounds, p[0], p[2]));
  for (const [key, texture] of [
    ["smoke", propsState.smokeParticleTextureCache],
    ["glow", propsState.glowParticleTextureCache],
  ])
    if (texture?.image)
      details[`${key}Texture`] = (await exportTexture(`region-${key}.png`, texture)).file;
  await json("region-prop-details.json", details);
  report(
    `Prop details complete: ${Object.keys(details.materials).length} materials, ${details.windmills.length} windmills, ${details.smoke.length} chimneys`,
  );
  return details;
}
export function installPropDetailsExport(ctx, panel) {
  const button = document.createElement("button");
  button.textContent = "Export exact prop materials and animated details";
  const status = document.createElement("output");
  status.style.display = "block";
  panel.append(button, status);
  button.onclick = async () => {
    button.disabled = true;
    try {
      await exportPropDetails(ctx, window.__godotRegionManifest ?? selectRegion(ctx), (value) => {
        status.textContent = value;
      });
    } catch (error) {
      status.textContent = `Prop details failed: ${error.stack ?? error.message}`;
    } finally {
      button.disabled = false;
    }
  };
}
