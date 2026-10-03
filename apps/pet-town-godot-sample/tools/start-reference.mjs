import { createServer } from "../../pet-town-3d/node_modules/vite/dist/node/index.js";
import { fileURLToPath } from "node:url";
const root = fileURLToPath(new URL("../../pet-town-3d/", import.meta.url));
const server = await createServer({
  root,
  configFile: root + "vite.config.js",
  server: {
    host: "127.0.0.1",
    port: 1422,
    strictPort: true,
    hmr: false,
    watch: { ignored: ["**/pet-town-godot-sample/assets/**", "**/var/**"] },
  },
});
await server.listen();
server.printUrls();
