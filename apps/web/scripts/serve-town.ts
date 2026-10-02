import { createReadStream, existsSync, statSync } from "node:fs";
import { extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import type { Plugin } from "vite";

const directory = resolve(
  fileURLToPath(new URL("../../pet-town-3d/dist-public/", import.meta.url)),
);
const types: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".ttf": "font/ttf",
  ".woff2": "font/woff2",
  ".ogg": "audio/ogg",
  ".mp3": "audio/mpeg",
};

/** Let the website's dev server preview the same static game used in production. */
export function serveTown(): Plugin {
  return {
    name: "public-town-preview",
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        const prefix = `${server.config.base}play`.replace(/\/+/g, "/");
        const url = request.url?.split("?")[0] ?? "";
        if (url === prefix) {
          response.writeHead(302, { Location: `${prefix}/` });
          response.end();
          return;
        }
        if (!url.startsWith(`${prefix}/`)) return next();
        let path;
        try {
          path = decodeURIComponent(url.slice(prefix.length + 1)) || "index.html";
        } catch {
          response.writeHead(400);
          response.end();
          return;
        }
        const file = resolve(directory, path);
        if (!file.startsWith(directory + sep) || !existsSync(file) || !statSync(file).isFile()) {
          response.writeHead(404, { "Content-Type": "text/plain" });
          response.end(
            "Town preview is unavailable. Run pnpm --filter @pet-town/three-town build:public.",
          );
          return;
        }
        response.writeHead(200, {
          "Content-Type": types[extname(file)] ?? "application/octet-stream",
        });
        createReadStream(file).pipe(response);
      });
    },
  };
}
