import { defineConfig } from "vite";
import { serveTown } from "./scripts/serve-town";

export default defineConfig({
  plugins: [serveTown()],
  base: process.env.VITE_BASE_PATH ?? "/",
  server: {
    port: 4173,
    strictPort: true,
  },
  preview: {
    port: 4173,
    strictPort: true,
  },
});
