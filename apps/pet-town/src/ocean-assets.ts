import type { HerdrState } from "./flow-types";
import type { PetTheme, PreferencesFile } from "./preferences-types";

// Ocean art is bundled separately from the Standard behavior packs.
const oceanModules = import.meta.glob("./pets/*/ocean-*.webp", {
  eager: true,
  import: "default",
  query: "?url",
}) as Record<string, string>;

const oceanAssets = new Map(
  Object.entries(oceanModules).map(([path, url]) => {
    const [, , petId, filename] = path.split("/");
    return [`${petId}/${filename.slice(0, -5)}`, url];
  }),
);

export function oceanClipName(state: HerdrState): string | null {
  return state === "working"
    ? "ocean-rowing"
    : state === "blocked" || state === "done" || state === "listening" || state === "speaking"
      ? `ocean-${state}`
      : null;
}

export function oceanRowingUrl(petId: string): string | null {
  return oceanAssets.get(`${petId}/ocean-rowing`) ?? null;
}

export function oceanStateUrl(
  petId: string,
  state: HerdrState,
  requiredDevicePixels = Infinity,
): string | null {
  const clip = oceanClipName(state);
  if (!clip) return null;
  const key = oceanAssets.has(`${petId}/${clip}`) ? `${petId}/${clip}` : `${petId}/ocean-rowing`;
  const original = oceanAssets.get(key) ?? null;
  if (!original) return null;
  return requiredDevicePixels <= 128 ? (oceanAssets.get(`${key}-128`) ?? original) : original;
}

export function effectivePetTheme(preferences: PreferencesFile | null, petId: string): PetTheme {
  if (
    ["rainforest", "snowy", "desert", "rollercoaster"].includes(
      preferences?.app.stripTheme ?? "",
    ) ||
    !oceanRowingUrl(petId)
  )
    return "standard";
  return preferences?.app.stripTheme === "ocean" || preferences?.pets[petId]?.theme === "ocean"
    ? "ocean"
    : "standard";
}
