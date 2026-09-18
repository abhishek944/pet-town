import { listen } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { loadCapabilityMappings } from "./pets";
import { VillageGame } from "./village-game";
import { applyAppearance, loadPreferences, type V2Preferences } from "./preferences";

async function start(): Promise<void> {
  const mode = document.body.dataset.mode === "playroom" ? "playroom" : "overlay";
  let preferences = await loadPreferences();
  await loadCapabilityMappings();
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  const effective = (): V2Preferences => ({
    ...preferences,
    reducedMotion: preferences.reducedMotion || motion.matches,
  });
  applyAppearance(preferences);
  const game = new VillageGame(mode, effective());
  await game.start();
  const update = (next: V2Preferences): void => {
    if (mode === "playroom" && !next.playroomEnabled) {
      if ("__TAURI_INTERNALS__" in window) void getCurrentWindow().close();
      else window.close();
      return;
    }
    preferences = next;
    applyAppearance(preferences);
    game.updatePreferences(effective());
  };
  motion.addEventListener("change", () => game.updatePreferences(effective()));
  window.addEventListener("pet-village-preferences", (event) =>
    update((event as CustomEvent<V2Preferences>).detail),
  );
  window.addEventListener("storage", (event) => {
    if (event.key === "pet-village-v2.preferences") void loadPreferences().then(update);
  });
  await listen<V2Preferences>("preferences-changed", (event) => update(event.payload)).catch(
    () => undefined,
  );
  await listen("capability-mappings-changed", () => {
    void loadCapabilityMappings()
      .then(() => game.refreshCapabilityMappings())
      .catch(() => undefined);
  }).catch(() => undefined);
}

void start();
