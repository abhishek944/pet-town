import { writeFile } from "node:fs/promises";

// The source Mayor portrait uses its original SVG fallback, without a pet model.
globalThis.document = {
  createElement() {
    return { style: {}, setAttribute() {}, innerHTML: "" };
  },
};
const { createPortrait } = await import("../../pet-town-3d/src/pet-town/ui/portrait.js");
const portrait = createPortrait({ id: "pet-town-mayor", isMayor: true });
const svg = portrait.innerHTML.replace(
  "<svg viewBox",
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox',
);
await writeFile(new URL("./icons/companion-mayor.svg", import.meta.url), `${svg}\n`);
