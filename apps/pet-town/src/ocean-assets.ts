import type { PreferencesFile, StripTheme } from "./preferences-types";

// Ocean art is bundled separately from the Standard behavior packs. Until
// additional Ocean states have artwork, every visible state uses this rowing clip.
const oceanModules = import.meta.glob("./pets/*/ocean-rowing.png", {
  eager: true,
  import: "default",
  query: "?url",
}) as Record<string, string>;

const rowingAssets = new Map(
  Object.entries(oceanModules).map(([path, url]) => [path.split("/")[2], url]),
);

export function oceanRowingUrl(petId: string): string | null {
  return rowingAssets.get(petId) ?? null;
}

export function effectivePetTheme(preferences: PreferencesFile | null, petId: string): StripTheme {
  if (!oceanRowingUrl(petId)) return "standard";
  return preferences?.app.stripTheme === "ocean" || preferences?.pets[petId]?.theme === "ocean"
    ? "ocean"
    : "standard";
}
