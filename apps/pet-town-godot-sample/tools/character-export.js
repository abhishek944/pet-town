import { GLTFExporter } from "../../pet-town-3d/node_modules/three/examples/jsm/exporters/GLTFExporter.js";
import { exportCharacter } from "./export-character.js";

export async function exportPlayerCharacter(report = () => {}) {
  report("Baking original Pip movement, swimming and leaf gliding…");
  const { root, animations, metadata } = exportCharacter();
  root.updateMatrixWorld(true);
  const binary = await new GLTFExporter().parseAsync(root, {
    binary: true,
    animations,
    onlyVisible: true,
    maxTextureSize: 1024,
  });
  const response = await fetch("http://127.0.0.1:1427/asset/explorer.glb", {
    method: "POST",
    headers: { "Content-Type": "application/octet-stream" },
    body: binary,
  });
  if (!response.ok) throw new Error(`Explorer export: ${response.status}`);
  report(`Pip exported: ${animations.map((clip) => clip.name).join(", ")}`);
  return { bytes: binary.byteLength, ...metadata };
}

export function installCharacterExport() {
  document.getElementById("godot-character-export")?.remove();
  const panel = document.createElement("div");
  panel.id = "godot-character-export";
  panel.style.cssText =
    "position:fixed;left:20px;top:360px;z-index:999999;background:#fff4dc;color:#342c23;padding:16px;border-radius:16px;font:14px sans-serif";
  const button = document.createElement("button");
  button.textContent = "Export original Pip swim and glide";
  const status = document.createElement("output");
  status.style.display = "block";
  status.setAttribute("aria-label", "Godot character export status");
  status.textContent = "Ready: source Pip with original leaf glider and swimming";
  panel.append(button, status);
  document.body.append(panel);
  button.onclick = async () => {
    button.disabled = true;
    try {
      await exportPlayerCharacter((message) => {
        status.textContent = message;
      });
    } catch (error) {
      status.textContent = `Export failed: ${error.message}`;
      console.error(error);
    } finally {
      button.disabled = false;
    }
  };
}
