import { GLTFExporter } from "../../pet-town-3d/node_modules/three/examples/jsm/exporters/GLTFExporter.js";
import { PET_CATALOG } from "../../pet-town-3d/src/pet-town/pets/catalog.js";
import { createPetPortrait } from "../../pet-town-3d/src/pet-town/pets/portrait.js";
import { companionAsset } from "./companion-animation.js";
import { json, post } from "./region-data.js";

async function portrait(id) {
  const image = createPetPortrait(id).querySelector("img");
  if (!image?.src.startsWith("data:image/png"))
    throw new Error(`Original ${id} portrait unavailable`);
  const blob = await (await fetch(image.src)).blob();
  await post(`companion-${id}.png`, blob, "image/png");
}

export async function exportCompanions(ctx, region, report = () => {}) {
  const manifest = {
    version: 1,
    source: "Original Three.js pet catalog, character rig and studio portraits",
    catalog: [],
    actors: [],
  };
  const definitions = [
    ...PET_CATALOG,
    { id: "mayor", name: "Mayor", species: "Original crowned Pip" },
  ];
  for (const definition of definitions) {
    report(
      `Original companion ${definition.name} (${manifest.catalog.length + 1}/${definitions.length})`,
    );
    if (definition.id !== "mayor") await portrait(definition.id);
    const asset = companionAsset(definition.id);
    try {
      asset.root.updateMatrixWorld(true);
      const binary = await new GLTFExporter().parseAsync(asset.root, {
        binary: true,
        animations: asset.animations,
        onlyVisible: true,
        maxTextureSize: 1024,
      });
      const modelFile = `companion-${definition.id}.glb`;
      await post(modelFile, binary);
      const metadata = {
        ...definition,
        modelFile,
        bytes: binary.byteLength,
        scale: definition.id === "mayor" ? 1 : 0.64,
        runtimeScale: 1,
        facial: asset.facial,
        animations: asset.animations.map(({ name, duration }) => ({ name, duration })),
      };
      if (definition.id === "mayor") manifest.mayor = metadata;
      else manifest.catalog.push({ ...metadata, portraitFile: `companion-${definition.id}.png` });
    } finally {
      asset.dispose();
    }
  }
  for (const actor of ctx.petTown?.agents?.records?.values?.() ?? [])
    manifest.actors.push({
      id: actor.id,
      label: actor.label,
      petId: actor.petId,
      isMayor: actor.isMayor === true,
      position: actor.position.toArray(),
      facing: actor.facing,
    });
  await json("companion-manifest.json", manifest);
  region.companionsFile = "companion-manifest.json";
  report(
    `Companions complete: ${manifest.catalog.length} original pet models, portraits and crowned Mayor`,
  );
  return manifest;
}
