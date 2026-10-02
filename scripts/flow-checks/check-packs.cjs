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
const kaykitPets = [
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
const restoredPets = {
  "bao-panda-chef": ["waddle", "bamboo-chop"],
  "bigfoot-yeti": ["lumbering-lope", "snow-toss"],
  "brassbell-automaton-porter": ["heavy-march", "parcel-sort"],
  cat: ["stalk", "watch"],
  dog: ["sprint", "listen"],
  "ember-fox-ronin": ["scout", "sword-practice"],
  "fern-potted-plant": ["leaf-sway-step", "sprout-leaf"],
  "gus-mail-carrier": ["quick-stride", "letter-sort"],
  "human-male": ["patrol", "inspect"],
  "jun-clockwork-apprentice": ["tool-belt-walk", "bird-repair"],
  "kip-penguin-postman": ["waddle", "parcel-toss"],
  "mira-dune-spear-scout": ["dune-patrol", "spear-drill"],
  "mossback-turtle-monk": ["staff-walk", "gentle-bow"],
  "nib-dragon-hatchling": ["toddle-hop", "flame-puff"],
  "pebble-slime-knight": ["lid-block", "lid-block"],
  "pudge-hedgehog": ["quick-trot", "leaf-gather"],
  "skiff-raccoon-sky-pirate": ["sneaky-march", "telescope-scan"],
  "sol-capybara": ["slow-stroll", "steam-soak"],
  viking: ["march", "ponder"],
  "wisp-little-ghost": ["float-drift", "boo-puff"],
};
const expectedPets = [...kaykitPets, ...Object.keys(restoredPets)].sort();
if (JSON.stringify(petDirectories) !== JSON.stringify(expectedPets)) {
  throw new Error(
    `bundled roster does not match the thirty characters: ${petDirectories.join(", ")}`,
  );
}
for (const pet of petDirectories) {
  const directory = path.join(petsDirectory, pet);
  const manifest = JSON.parse(fs.readFileSync(path.join(directory, "flow.json"), "utf8"));
  const assets = collectAssets(directory);
  const result = compileBehaviorPack(manifest, assets);
  if (!result.pack) throw new Error(`${pet}/flow.json: ${JSON.stringify(result.diagnostics)}`);
  if (result.pack.id !== pet) throw new Error(`${pet}/flow.json: pack id must match its folder`);
  const requiredAssets = [
    "sleep.png",
    "walk.png",
    "ocean-rowing.png",
    "ocean-blocked.png",
    "ocean-done.png",
    "ocean-listening.png",
    "ocean-speaking.png",
  ];
  if (kaykitPets.includes(pet)) requiredAssets.push("blocked.png", "listen.png", "speak.png");
  else requiredAssets.push("wave.png", "done.png");
  const missingAssets = requiredAssets.filter((asset) => !Object.hasOwn(assets, asset));
  if (missingAssets.length)
    throw new Error(`${pet}: missing bundled artwork: ${missingAssets.join(", ")}`);
  if (result.pack.states.idle.flow.type !== "hide")
    throw new Error(`${pet}/flow.json: idle visibility is not flow-authored`);
  if ("actions" in result.pack)
    throw new Error(`${pet}/flow.json: menu animations are not allowed`);
  const restored = restoredPets[pet];
  const expectedAnimations = {
    working: restored ? restored[0] : "walk",
    blocked: restored ? restored[1] : "think",
    done: "sleep",
    listening: restored ? restored[1] : "listen",
    speaking: restored ? restored[1] : "speak",
  };
  for (const [state, animation] of Object.entries(expectedAnimations)) {
    if (result.pack.stateAssignments[state].animation !== animation)
      throw new Error(`${pet}/flow.json: ${state} has wrong APNG`);
  }
  if (result.pack.stateAssignments.working.action !== "walking")
    throw new Error(`${pet}: running pet does not walk`);
  for (const state of ["blocked", "done", "listening", "speaking"]) {
    if (result.pack.stateAssignments[state].action !== "idle")
      throw new Error(`${pet}: ${state} pet moves`);
  }
  if (result.pack.stateAssignments.unknown.visible)
    throw new Error(`${pet}: unknown pet is visible`);
}
console.log("bundled thirty-character pack checks: pass");
