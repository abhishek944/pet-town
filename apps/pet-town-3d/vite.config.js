import { defineConfig } from "vite";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

export default defineConfig(({ mode }) => ({
  base: "./",
  resolve: {
    alias: {
      "#town-extensions": fileURLToPath(
        new URL(
          mode === "public" ? "./src/public-town/index.js" : "./src/extensions/index.js",
          import.meta.url,
        ),
      ),
    },
  },
  plugins: [
    {
      name: "town-welcome-entry",
      transformIndexHtml: {
        order: "pre",
        handler(html) {
          const welcome = readFileSync(
            new URL("./src/hud/splash/assets/welcome.html", import.meta.url),
            "utf8",
          );
          html = html.replace("<!--town-welcome-->", welcome);
          return mode === "public"
            ? html
                .replace("/src/main.js", "/src/public-town/start.js")
                .replace(
                  '<div class="town-sound-note">',
                  '<div class="public-boot-links">' +
                    '<a href="../">← Back to Pet Town</a></div>' +
                    "<noscript>Enable JavaScript to play the town.</noscript>" +
                    '<div class="town-sound-note">',
                )
                .replace(
                  "<title>Pet Town</title>",
                  "<title>Play Pet Town — a solo town preview</title>",
                )
            : html;
        },
      },
    },
    {
      name: "game-third-party-notices",
      generateBundle() {
        this.emitFile({
          type: "asset",
          fileName: "THIRD_PARTY_NOTICES.md",
          source: readFileSync(new URL("./THIRD_PARTY_NOTICES.md", import.meta.url), "utf8"),
        });
      },
    },
  ],
  server: { host: "127.0.0.1", port: 1422, strictPort: true },
  preview: { host: "127.0.0.1", port: 1422, strictPort: true },
  build: {
    outDir: mode === "public" ? "dist-public" : "dist",
    sourcemap: mode !== "public",
    target: "es2022",
  },
}));
