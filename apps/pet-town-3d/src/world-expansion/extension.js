import { createTrailProgress } from "./activities/progress.js";
import { createTrailJournal } from "./activities/journal.js";
import { createSunmeadowGarden } from "./activities/garden.js";
import { getGardenSupport } from "./activities/garden-support.js";
import { createWillowmereActivities } from "./willowmere/activities.js";
import { createWillowmereProgress, combineTrailProgress } from "./willowmere/progress.js";
import { createShellhavenProgress } from "./shellhaven/progress.js";
import { createShellhavenActivities } from "./shellhaven/activities.js";
import { travelToPlace } from "./activities/travel.js";
import {
  getTrailPlaces,
  GARDEN_POSITION,
  distanceToPlace,
  expansionRestored,
} from "./activities/places.js";

/** A district owns its discoveries, gardening and journal without changing native actions. */
export function createWorldExpansionExtension() {
  let runtime;
  return {
    id: "world-expansion",
    init(context) {
      if (!(context.terrain.expansion?.stage >= 1)) return;
      let journal;
      let error = "";
      let storageWarning = "";
      function report(message) {
        if (message.includes("could not be read.")) storageWarning = message;
        if (!message) message = storageWarning;
        if (message === error) return;
        error = message;
        journal?.error(message);
        if (message) context.hud?.toast(message);
      }
      const sunmeadowProgress = createTrailProgress(report);
      const willowmereProgress =
        context.terrain.expansion.stage >= 2 ? createWillowmereProgress(report) : null;
      const shellhavenProgress =
        context.terrain.expansion.stage >= 3 ? createShellhavenProgress(report) : null;
      const progress = combineTrailProgress(
        sunmeadowProgress,
        willowmereProgress,
        shellhavenProgress,
      );
      const willowmere = willowmereProgress
        ? createWillowmereActivities(
            context,
            willowmereProgress,
            report,
            () => journal?.isOpen ?? false,
          )
        : null;
      const shellhaven = shellhavenProgress
        ? createShellhavenActivities(
            context,
            shellhavenProgress,
            report,
            () => journal?.isOpen ?? false,
          )
        : null;
      const places = getTrailPlaces(context);
      const garden = createSunmeadowGarden(context);
      garden.setStage(progress.state.garden);
      const actions = {
        willowmere,
        shellhaven,
        travel(place) {
          try {
            travelToPlace(context, place);
            if (progress.available) report("");
            journal.setOpen(false);
            context.hud?.toast(`Welcome to ${place.name}`);
          } catch (failure) {
            report(failure.message);
          }
        },
        garden() {
          if (
            !expansionRestored(context) ||
            distanceToPlace(context.player.position, GARDEN_POSITION) > 6
          )
            return;
          if (getGardenSupport(context.terrain) === null) {
            report(
              "The flower bed needs level, dry ground beneath every part of it. Restore the garden soil before planting.",
            );
            return;
          }
          if (progress.grow()) {
            report("");
            garden.setStage(progress.state.garden);
            context.hud?.toast(
              [
                "",
                "Seeds planted! Water them to bring out the leaves.",
                "Your seedlings are growing. Water once more for flowers.",
                "Your Sunmeadow garden is in bloom!",
              ][progress.state.garden],
            );
          }
        },
      };
      journal = createTrailJournal(context, progress, actions);
      journal.error(error);
      runtime = { journal, progress, garden, willowmere, shellhaven, places, retryAfter: 0 };
    },
    update(dt, context) {
      if (!runtime) return;
      const { journal, progress, garden } = runtime;
      journal.update();
      runtime.willowmere?.update(dt);
      runtime.shellhaven?.update();
      if (!expansionRestored(context)) return;
      garden.update(dt);
      if (
        context.hud?.blocking ||
        context.hud?.photoMode ||
        context.hud?.hidden ||
        !progress.available
      )
        return;
      if (context.time < runtime.retryAfter) return;
      for (const place of runtime.places) {
        if (
          progress.state.stamps.includes(place.id) ||
          distanceToPlace(context.player.position, place) > 7
        )
          continue;
        if (progress.stamp(place.id))
          context.hud?.toast(
            `${place.icon} Discovered ${place.name} · ${progress.state.stamps.length}/${runtime.places.length}`,
          );
        else runtime.retryAfter = context.time + 5;
      }
    },
    dispose() {
      if (!runtime) return;
      runtime.journal.dispose();
      runtime.willowmere?.dispose();
      runtime.shellhaven?.dispose();
      runtime.garden.dispose();
      runtime = null;
    },
  };
}
