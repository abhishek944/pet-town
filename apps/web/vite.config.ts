import { createReadStream } from "node:fs";
import { mkdir, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { create } from "tar";
import { defineConfig, type Plugin } from "vite";

const root = fileURLToPath(new URL("../..", import.meta.url));
const packageFiles = [
  "pet-village",
  "pet-village.bin",
  "pet-village-pi-runtime.tar.gz",
  "pet-village.source.sha256",
];
const downloadPackages = {
  "/downloads/Pet-Village-macOS-Apple-Silicon.tar.gz": "macos-arm64",
  "/downloads/Pet-Village-macOS-Intel.tar.gz": "macos-x64",
};

async function prepareDownloads(destination: string): Promise<void> {
  await mkdir(destination, { recursive: true });
  await Promise.all(
    Object.entries(downloadPackages).map(([pathname, packageName]) =>
      create(
        {
          cwd: `${root}/bin/${packageName}`,
          file: `${destination}/${pathname.split("/").at(-1)}`,
          gzip: true,
          portable: true,
          prefix: "Pet Village",
        },
        packageFiles,
      ),
    ),
  );
}

function downloadArtifacts(): Plugin {
  const developmentDownloads = `${root}/apps/web/.downloads`;
  return {
    name: "pet-village-download-artifacts",
    async configureServer(server) {
      await prepareDownloads(developmentDownloads);
      server.middlewares.use(async (request, response, next) => {
        const pathname = request.url?.split("?", 1)[0] ?? "";
        if (!(pathname in downloadPackages)) return next();
        const source = `${developmentDownloads}/${pathname.split("/").at(-1)}`;
        const metadata = await stat(source);
        response.setHeader("Content-Type", "application/gzip");
        response.setHeader("Content-Length", metadata.size);
        response.setHeader(
          "Content-Disposition",
          `attachment; filename="${pathname.split("/").at(-1)}"`,
        );
        if (request.method === "HEAD") return response.end();
        createReadStream(source).pipe(response);
      });
    },
    async closeBundle() {
      await prepareDownloads(`${root}/apps/web/dist/downloads`);
    },
  };
}

export default defineConfig({
  plugins: [downloadArtifacts()],
  server: {
    port: 4173,
    strictPort: true,
  },
  preview: {
    port: 4173,
    strictPort: true,
  },
});
