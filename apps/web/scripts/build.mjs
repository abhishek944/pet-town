import { execFileSync } from "node:child_process";
import { cpSync, mkdirSync } from "node:fs";
import { fileURLToPath, URL } from "node:url";

const webRoot = fileURLToPath(new URL("../", import.meta.url));
const townOutput = fileURLToPath(new URL("../../pet-town-3d/dist-public/", import.meta.url));
const target = fileURLToPath(new URL("../dist/play/", import.meta.url));
execFileSync("pnpm", ["exec", "vite", "build"], { cwd: webRoot, stdio: "inherit" });
execFileSync("pnpm", ["--filter", "@pet-town/three-town", "build:public"], {
  cwd: webRoot,
  stdio: "inherit",
});
mkdirSync(target, { recursive: true });
cpSync(townOutput, target, { recursive: true });
