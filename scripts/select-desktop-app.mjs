import { spawnSync } from "node:child_process";

const app = process.env.PET_VILLAGE_APP ?? "v1";
if (app !== "v1" && app !== "v2") {
  console.error(`PET_VILLAGE_APP must be v1 or v2, received: ${app}`);
  process.exit(2);
}
const command = process.argv[2] ?? "dev";
const extra = process.argv.slice(3);
const packageName = app === "v2" ? "@pet-village/desktop-v2" : "@pet-village/desktop";
const supported = new Set(["dev", "build", "package", "tauri"]);
if (!supported.has(command)) {
  console.error(`Desktop command must be one of: ${[...supported].join(", ")}`);
  process.exit(2);
}
console.log(`Pet Village desktop selection: ${app} (${packageName})`);
const packageCommand = command === "package" ? "tauri" : command;
const packageArgs = command === "package" ? ["build", ...extra] : extra;
const result = spawnSync("pnpm", ["--filter", packageName, packageCommand, ...packageArgs], {
  stdio: "inherit",
  env: process.env,
});
process.exit(result.status ?? 1);
