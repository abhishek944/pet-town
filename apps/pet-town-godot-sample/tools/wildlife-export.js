import { GLTFExporter } from "../../pet-town-3d/node_modules/three/examples/jsm/exporters/GLTFExporter.js";
import { wildlifeAsset } from "./wildlife-animation.js";
import { creaturesState } from "../../pet-town-3d/src/creatures/state.js";
import { createCreatureEmoteIconTexture } from "../../pet-town-3d/src/creatures/emotes/create-creature-emote-icon-texture.js";

async function post(name, body, type = "application/octet-stream") {
  const response = await fetch(`http://127.0.0.1:1427/asset/${name}`, {
    method: "POST",
    headers: { "Content-Type": type },
    body,
  });
  if (!response.ok) throw new Error(`${name}: ${response.status}`);
}

export async function exportWildlife(ctx, options = {}) {
  const bounds = options.bounds ?? window.__godotRegionManifest?.bounds;
  const contains =
    options.contains ??
    ((x, z) =>
      !bounds || (x >= bounds.minX && x < bounds.maxX && z >= bounds.minZ && z < bounds.maxZ));
  const report = options.report ?? (() => {});
  const originals = ctx.creatures.filter((actor) => contains(actor.position.x, actor.position.z));
  const manifest = {
    version: 1,
    source: "Three.js creature actors and original procedural animation",
    waterLevel: ctx.terrain.waterLevel ?? ctx.water?.level ?? -1000,
    waterSurface: ctx.water?.surfaceY,
    seed: ctx.__creatureState.seed,
    actors: [],
    assets: [],
    pond: ctx.terrain.landmarks?.pond,
  };
  const keys = new Map();
  for (const actor of originals) {
    const key = `wildlife-${actor.species}-${actor.variant}`;
    keys.set(key, { def: actor.def, variant: actor.variant });
    manifest.actors.push({
      model: key,
      species: actor.species,
      name: actor.name,
      variant: actor.variant,
      rare: actor.rare,
      size: actor.size,
      yaw: actor.yaw,
      position: actor.position.toArray(),
      home: actor.home.toArray(),
      definition: Object.fromEntries(
        Object.entries(actor.def).filter(
          ([key, value]) => key !== "build" && key !== "variants" && typeof value !== "function",
        ),
      ),
    });
  }
  for (const [key, { def, variant }] of keys) {
    report(`Wildlife ${key} (${manifest.assets.length + 1}/${keys.size})`);
    const { root, animations } = wildlifeAsset(def, variant);
    const binary = await new GLTFExporter().parseAsync(root, {
      binary: true,
      animations,
      onlyVisible: false,
      maxTextureSize: 1024,
    });
    await post(`${key}.glb`, binary);
    manifest.assets.push({
      name: key,
      bytes: binary.byteLength,
      clips: animations.map((a) => a.name),
    });
  }
  for (const kind of ["heart", "sparkle", "question", "exclaim", "note"]) {
    const texture = createCreatureEmoteIconTexture(kind);
    const blob = await new Promise((resolve) => texture.image.toBlob(resolve));
    await post(`wildlife-${kind}.png`, blob, "image/png");
    texture.dispose();
  }
  await post("wildlife-manifest.json", JSON.stringify(manifest), "application/json");
  report(
    `Wildlife complete: ${manifest.actors.length} original actors, ${keys.size} species/variants`,
  );
  return manifest;
}
