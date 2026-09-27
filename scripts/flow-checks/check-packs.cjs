const fs = require("node:fs");
const path = require("node:path");
const root = process.argv[2];
const { compileBehaviorPack } = require(process.argv[3]);
const petsDirectory = path.join(root, "src/pets");
const petDirectories = fs
  .readdirSync(petsDirectory, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();
if (petDirectories.length === 0) throw new Error("expected at least one bundled pet pack");
function collectAssets(directory, current = directory) {
  return Object.fromEntries(
    fs.readdirSync(current, { withFileTypes: true }).flatMap((entry) => {
      const absolute = path.join(current, entry.name);
      if (entry.isDirectory()) return Object.entries(collectAssets(directory, absolute));
      if (!entry.isFile() || !entry.name.endsWith(".png")) return [];
      return [[path.relative(directory, absolute).split(path.sep).join("/"), entry.name]];
    }),
  );
}
const expectedPets = [
  "barbarian",
  "hooded-rogue",
  "knight",
  "mage",
  "ranger",
  "rogue",
  "skeleton-mage",
  "skeleton-minion",
  "skeleton-rogue",
  "skeleton-warrior",
];
if (JSON.stringify(petDirectories) !== JSON.stringify(expectedPets)) {
  throw new Error(
    `bundled roster does not match the ten humanoid characters: ${petDirectories.join(", ")}`,
  );
}
for (const pet of petDirectories) {
  const directory = path.join(petsDirectory, pet);
  const manifest = JSON.parse(fs.readFileSync(path.join(directory, "flow.json"), "utf8"));
  const assets = collectAssets(directory);
  const result = compileBehaviorPack(manifest, assets);
  if (!result.pack) throw new Error(`${pet}/flow.json: ${JSON.stringify(result.diagnostics)}`);
  if (result.pack.id !== pet) throw new Error(`${pet}/flow.json: pack id must match its folder`);
  const expectedAssets = ["blocked.png", "sleep.png", "walk.png"];
  if (JSON.stringify(Object.keys(assets).sort()) !== JSON.stringify(expectedAssets))
    throw new Error(`${pet}: expected blocked.png, sleep.png, and walk.png`);
  if (result.pack.states.idle.flow.type !== "hide")
    throw new Error(`${pet}/flow.json: idle visibility is not flow-authored`);
  if ("actions" in result.pack)
    throw new Error(`${pet}/flow.json: menu animations are not allowed`);
  const expectedAnimations = {
    working: "walk",
    blocked: "think",
    done: "sleep",
    listening: manifest.clips.listen ? "listen" : "walk",
  };
  for (const [state, animation] of Object.entries(expectedAnimations)) {
    if (result.pack.stateAssignments[state].animation !== animation)
      throw new Error(`${pet}/flow.json: ${state} has wrong APNG`);
  }
  if (result.pack.stateAssignments.working.action !== "walking")
    throw new Error(`${pet}: running pet does not walk`);
  for (const state of ["blocked", "done", "listening"]) {
    if (result.pack.stateAssignments[state].action !== "idle")
      throw new Error(`${pet}: ${state} pet moves`);
  }
  if (result.pack.stateAssignments.unknown.visible)
    throw new Error(`${pet}: unknown pet is visible`);
}
console.log("bundled ten-character pack checks: pass");
