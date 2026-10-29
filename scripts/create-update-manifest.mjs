import { Buffer } from "node:buffer";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import console from "node:console";
import { createReadStream, readFileSync, statSync, writeFileSync } from "node:fs";
import process from "node:process";
import { join } from "node:path";

const directory = process.argv[2];
const tag = process.env.GITHUB_REF_NAME;
const repository = process.env.GITHUB_REPOSITORY;
const config = JSON.parse(readFileSync("apps/pet-town/src-tauri/tauri.conf.json", "utf8"));
const version = config.version;
const cargo = readFileSync("apps/pet-town/src-tauri/Cargo.toml", "utf8");
const cargoVersion = cargo.match(/^\[package\][\s\S]*?^version\s*=\s*"([^"]+)"/m)?.[1];
const parsedVersion =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([\dA-Za-z-]+(?:\.[\dA-Za-z-]+)*))?(?:\+[\dA-Za-z-]+(?:\.[\dA-Za-z-]+)*)?$/.exec(
    version,
  );
if (!parsedVersion || parsedVersion[4]?.split(".").some((id) => /^0\d+$/.test(id))) {
  throw new Error("The app must have a semantic version.");
}
if (tag !== `v${version}` || cargoVersion !== version) {
  throw new Error("Release tag, Tauri version, and Cargo package version must match.");
}
if (repository !== "abhishek944/pet-town") {
  throw new Error("GITHUB_REPOSITORY must be the component's pinned release repository.");
}

// Decode only public signing material; private signing keys never enter this script.
const publicLines = Buffer.from(config.plugins.updater.pubkey, "base64")
  .toString("utf8")
  .trim()
  .split(/\r?\n/);
const publicKey = Buffer.from(publicLines[1] ?? "", "base64");
if (publicKey.length !== 42) throw new Error("The configured updater public key is invalid.");

async function artifact(filename) {
  const size = statSync(join(directory, filename)).size;
  if (!size) throw new Error(`${filename} is empty.`);
  const signature = readFileSync(join(directory, `${filename}.sig`), "utf8").trim();
  const signatureLines = Buffer.from(signature, "base64").toString("utf8").trim().split(/\r?\n/);
  const signatureBytes = Buffer.from(signatureLines[1] ?? "", "base64");
  if (
    !/^[A-Za-z0-9+/]+={0,2}$/.test(signature) ||
    signatureLines.length !== 4 ||
    !signatureLines[2].startsWith("trusted comment: ") ||
    Buffer.from(signatureLines[3], "base64").length !== 64 ||
    signatureBytes.length !== 74 ||
    !signatureBytes.subarray(2, 10).equals(publicKey.subarray(2, 10))
  ) {
    throw new Error(`${filename} signature does not match the app's signing key.`);
  }
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(join(directory, filename))) hash.update(chunk);
  return {
    url: `https://github.com/${repository}/releases/download/${encodeURIComponent(tag)}/${filename}`,
    signature,
    sha256: hash.digest("hex"),
    size,
  };
}

if (directory) {
  const platforms = {};
  const components = {};
  for (const [platform, architecture] of [
    ["darwin-aarch64", "Apple-Silicon"],
    ["darwin-x86_64", "Intel"],
  ]) {
    const host = await artifact(`Pet-Town-macOS-${architecture}.app.tar.gz`);
    platforms[platform] = { url: host.url, signature: host.signature };
    const filename = `Pet-Town-World-macOS-${architecture}.tar.gz`;
    execFileSync(
      "python3",
      [
        "scripts/town-component-archive.py",
        "validate",
        join(directory, filename),
        version,
        platform,
      ],
      { stdio: "inherit" },
    );
    components[platform] = await artifact(filename);
  }
  writeFileSync(
    join(directory, "town-component.json"),
    JSON.stringify({ formatVersion: 1, version, platforms: components }, null, 2) + "\n",
  );
  writeFileSync(
    join(directory, "latest.json"),
    JSON.stringify(
      {
        version,
        notes: `Pet Town ${version}. See the GitHub release notes for details.`,
        pub_date: new Date().toISOString(),
        platforms,
      },
      null,
      2,
    ) + "\n",
  );
  console.log(`Host and Town manifests ready for ${tag}, both Mac architectures.`);
} else {
  console.log(`Release version and public updater key preflight passed for ${tag}.`);
}
