import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { Plugin } from "vite";

const sectionNames = [
  "header",
  "hero",
  "features",
  "setup",
  "companions",
  "mayor",
  "town",
  "faq",
  "download",
  "footer",
];
const sectionFiles = new Map(
  sectionNames.map((name) => [
    name,
    fileURLToPath(new URL(`../sections/${name}.html`, import.meta.url)),
  ]),
);

export function landingHtml(): Plugin {
  const files = new Set(sectionFiles.values());

  return {
    name: "landing-html-sections",
    buildStart() {
      for (const file of files) this.addWatchFile(file);
    },
    transformIndexHtml: {
      order: "pre",
      handler(html) {
        return html.replace(/<!-- landing:([a-z-]+) -->/g, (marker, name: string) => {
          const file = sectionFiles.get(name);
          if (!file) throw new Error(`Unknown landing HTML section: ${marker}`);
          return readFileSync(file, "utf8");
        });
      },
    },
    configureServer(server) {
      server.watcher.add([...files]);
      server.watcher.on("change", (file) => {
        if (files.has(resolve(file))) server.ws.send({ type: "full-reload" });
      });
    },
  };
}
