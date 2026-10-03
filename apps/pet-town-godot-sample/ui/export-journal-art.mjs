import { readFile, writeFile } from "node:fs/promises";

// Keep native field-book art identical to the authored Three.js illustrations.
const sourcePath = new URL(
  "../../pet-town-3d/src/world-expansion/activities/journal-art.js",
  import.meta.url,
);
const source = await readFile(sourcePath, "utf8");
const { journalArt } = await import(
  `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`
);
const kinds = [
  "garden", "fish", "lantern", "shell", "photo", "dolphin", "reef",
  "kelp", "wreck", "island", "ship", "glow", "stars",
];
for (const kind of kinds) {
  const target = new URL(`./icons/journal-${kind}.svg`, import.meta.url);
  await writeFile(target, `${journalArt(kind)}\n`);
}
console.log(`Exported ${kinds.length} exact source Journal illustrations`);
