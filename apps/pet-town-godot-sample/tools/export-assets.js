import { GLTFExporter } from "../../pet-town-3d/node_modules/three/examples/jsm/exporters/GLTFExporter.js";
import * as THREE from "../../pet-town-3d/node_modules/three/build/three.module.js";
import { exportCharacter } from "./export-character.js";
import { exportTree, exportProp } from "./export-world.js";

const collector = "http://127.0.0.1:1427/asset/";
async function post(name, bytes, type = "application/octet-stream") {
  const response = await fetch(collector + name, {
    method: "POST",
    headers: { "Content-Type": type },
    body: bytes,
  });
  if (!response.ok) throw new Error(`${name}: collector ${response.status}`);
}

export function installAssetExport(ctx) {
  document.getElementById("godot-asset-export")?.remove();
  const panel = document.createElement("div");
  panel.id = "godot-asset-export";
  panel.style.cssText =
    "position:fixed;left:20px;top:100px;z-index:999999;background:#fff4dc;color:#342c23;padding:16px;border-radius:16px;font:14px sans-serif";
  const button = document.createElement("button");
  button.textContent = "Export Godot sample";
  const status = document.createElement("output");
  status.style.display = "block";
  status.setAttribute("aria-label", "Godot asset export status");
  status.textContent = "Ready: original Pip, trees, pavilion, bakery, block icons";
  panel.append(button, status);
  document.body.append(panel);
  button.onclick = async () => {
    button.disabled = true;
    const manifest = { version: 1, exportedAt: new Date().toISOString(), assets: [], icons: [] };
    try {
      const jobs = [
        ["explorer", () => exportCharacter()],
        ...["oak", "blossom", "pine"].map((type) => [`tree-${type}`, () => exportTree(ctx, type)]),
        ...["picnic-pavilion", "corner-bakery"].map((id) => [id, () => exportProp(ctx, id)]),
      ];
      for (const [name, build] of jobs) {
        status.textContent = `Exporting ${name}…`;
        await new Promise((resolve) => setTimeout(resolve, 30));
        const { root, animations = [], metadata } = build();
        root.updateMatrixWorld(true);
        const bounds = new THREE.Box3().setFromObject(root);
        const binary = await new GLTFExporter().parseAsync(root, {
          binary: true,
          animations,
          onlyVisible: true,
          maxTextureSize: 1024,
        });
        await post(`${name}.glb`, binary);
        manifest.assets.push({
          name,
          bytes: binary.byteLength,
          bounds: { min: bounds.min.toArray(), max: bounds.max.toArray() },
          ...metadata,
        });
      }
      for (const [index, block] of ctx.building.palette.slice(0, 12).entries()) {
        status.textContent = `Exporting block icon ${index + 1}/12…`;
        const blob = await new Promise((resolve) =>
          ctx.building.icon(block.key, 128).toBlob(resolve),
        );
        await post(`icon-${index}.png`, blob, "image/png");
        manifest.icons.push({
          index,
          key: block.key,
          name: block.name ?? block.label ?? block.key,
        });
      }
      await post("manifest.json", JSON.stringify(manifest), "application/json");
      status.textContent = `Complete: ${manifest.assets.length} original GLB assets and ${manifest.icons.length} icons`;
    } catch (error) {
      status.textContent = `Export failed: ${error.message}`;
      console.error(error);
    } finally {
      button.disabled = false;
    }
  };
}
