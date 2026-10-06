import { execFileSync } from "node:child_process";
import { cpSync, mkdirSync, rmSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { Plugin } from "vite";

const townSource = fileURLToPath(new URL("../../pet-town-3d/dist-public/", import.meta.url));

/**
 * Ship the public three.js town inside the landing page build, so one `vite build` produces the
 * whole deployable site. The town keeps its own build and is copied to `<outDir>/play/`, the
 * path the landing page links to.
 */
export function townBundle(): Plugin {
  let built = false;
  return {
    name: "town-bundle",
    apply: "build",
    buildStart() {
      if (built) return;
      built = true;
      execFileSync("pnpm", ["--filter", "@pet-town/three-town", "build:public"], {
        stdio: "inherit",
      });
    },
    writeBundle(options) {
      const environment = (this as { environment?: { name: string } }).environment;
      if (environment && environment.name !== "client") return;
      if (!options.dir) return;
      const target = resolve(options.dir, "play");
      rmSync(target, { recursive: true, force: true });
      mkdirSync(target, { recursive: true });
      cpSync(townSource, target, { recursive: true });
    },
  };
}
