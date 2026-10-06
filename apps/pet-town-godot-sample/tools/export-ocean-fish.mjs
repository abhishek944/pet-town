import { writeFile } from "node:fs/promises";
import { URL, fileURLToPath } from "node:url";
import { GLTFExporter } from "../../pet-town-3d/node_modules/three/examples/jsm/exporters/GLTFExporter.js";
import { exportFishModels } from "./ocean-export.js";

globalThis.FileReader ??= class {
  async readAsArrayBuffer(blob) {
    this.result = await blob.arrayBuffer();
    this.onloadend?.();
  }
};

await exportFishModels(async (name, root) => {
  root.updateMatrixWorld(true);
  const data = await new GLTFExporter().parseAsync(root, { binary: true, onlyVisible: false });
  await writeFile(
    fileURLToPath(new URL(`../assets/${name}`, import.meta.url)),
    new Uint8Array(data),
  );
});
