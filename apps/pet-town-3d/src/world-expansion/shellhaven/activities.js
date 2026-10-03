import { distanceToPlace, expansionRestored } from "../activities/places.js";
import { COAST_SHELLS, DISPLAY_SHELF } from "./places.js";
import { shellSupport, displaySupport } from "./support.js";
import { createShellhavenModels } from "./models.js";

export function createShellhavenActivities(context, progress, report, journalOpen) {
  for (const shell of COAST_SHELLS)
    context.vegetation?.clearArea(shell, 1.5, { trees: true, small: true });
  context.vegetation?.clearArea(DISPLAY_SHELF, 2.5, { trees: true, small: true });
  const models = createShellhavenModels(context);
  const hinted = new Set();
  let disposed = false;
  function enabled() {
    return (
      !disposed &&
      !document.hidden &&
      document.hasFocus() &&
      expansionRestored(context) &&
      !context.hud?.blocking &&
      !context.hud?.hidden &&
      !context.hud?.photoMode &&
      !context.petTown?.controller.selected &&
      !context.petTown?.terminal?.inputActive &&
      progress.available
    );
  }
  function nearbyShell() {
    return (
      COAST_SHELLS.filter((shell) => {
        const support = shellSupport(context, shell);
        return (
          !progress.state.shells.includes(shell.id) &&
          support !== null &&
          distanceToPlace(context.player.position, shell) <= 2.7 &&
          Math.abs(context.player.position.y - support) < 2.2
        );
      }).sort(
        (a, b) =>
          distanceToPlace(context.player.position, a) - distanceToPlace(context.player.position, b),
      )[0] ?? null
    );
  }
  function atDisplay() {
    const support = displaySupport(context);
    return (
      support !== null &&
      distanceToPlace(context.player.position, DISPLAY_SHELF) <= 5 &&
      Math.abs(context.player.position.y - support) < 2.2
    );
  }
  return {
    get status() {
      return {
        shells: progress.state.shells,
        favorite: progress.state.favorite,
        nearby: nearbyShell(),
        canCollect: enabled() && journalOpen(),
        canFeature: enabled() && journalOpen() && atDisplay(),
        displaySupported: displaySupport(context) !== null,
        available: progress.available,
      };
    },
    collect() {
      if (!enabled() || !journalOpen()) return;
      const shell = nearbyShell();
      if (!shell || !progress.collect(shell.id)) return;
      report("");
      models.update(progress.state);
      context.hud?.toast(
        `❋ Collected ${shell.name} · ${progress.state.shells.length}/6. Find it on your Shell Cove shelf.`,
      );
    },
    feature(id) {
      if (!enabled() || !journalOpen() || !atDisplay() || !progress.feature(id)) return;
      report("");
      models.update(progress.state);
      context.hud?.toast("Your favorite shell is sparkling on the cove display.");
    },
    update() {
      if (disposed) return;
      models.update(progress.state);
      if (!enabled() || journalOpen()) return;
      const shell = nearbyShell();
      if (!shell || hinted.has(shell.id)) return;
      hinted.add(shell.id);
      context.hud?.toast(`A ${shell.name} is sparkling nearby. Open J to collect it.`);
    },
    dispose() {
      disposed = true;
      hinted.clear();
      models.dispose();
    },
  };
}
