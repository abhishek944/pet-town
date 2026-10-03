import { Buffer } from "node:buffer";
import console from "node:console";
import { readFileSync, statSync, writeFileSync } from "node:fs";
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
if (!/^[\w.-]+\/[\w.-]+$/.test(repository ?? "")) {
  throw new Error("GITHUB_REPOSITORY must identify the release repository.");
}

// Decode only public signing material; private signing keys never enter this script.
const publicLines = Buffer.from(config.plugins.updater.pubkey, "base64")
  .toString("utf8")
  .trim()
  .split(/\r?\n/);
const publicKey = Buffer.from(publicLines[1] ?? "", "base64");
if (publicKey.length !== 42) throw new Error("The configured updater public key is invalid.");

if (directory) {
  const platforms = {};
  for (const [platform, architecture] of [
    ["darwin-aarch64", "Apple-Silicon"],
    ["darwin-x86_64", "Intel"],
  ]) {
    const filename = `Pet-Town-macOS-${architecture}.app.tar.gz`;
    if (!statSync(join(directory, filename)).size) throw new Error(`${filename} is empty.`);
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
    platforms[platform] = {
      url: `https://github.com/${repository}/releases/download/${encodeURIComponent(tag)}/${filename}`,
      signature,
    };
  }
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
  console.log(`Updater manifest ready for ${tag}, both Mac architectures.`);
} else {
  console.log(`Release version and public updater key preflight passed for ${tag}.`);
}
