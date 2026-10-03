import { distanceToPlace, expansionRestored } from "../activities/places.js";
import { createFishingModel } from "./fishing-model.js";
import { createWishLanternModel } from "./lantern-model.js";
import { fishingSupport, lanternSupport } from "./support.js";
import { FISHING_SHORE, FISHING_BOBBER, FISH_SPECIES, WISH_GROVE } from "./places.js";

export function createWillowmereActivities(context, progress, report, journalOpen) {
  const listeners = new AbortController();
  context.vegetation?.clearArea(FISHING_SHORE, 1.2, { trees: true, small: true });
  context.vegetation?.clearArea(WISH_GROVE, 3.3, { trees: true, small: true });
  const fishingModel = createFishingModel(context);
  const lanternModel = createWishLanternModel(context);
  let phase = "idle";
  let remaining = 0;
  let catchName = "";
  let message = "Cast from the shore. Wait for a nibble, then reel within four seconds.";
  let disposed = false;
  function enabled() {
    return (
      !disposed &&
      journalOpen() &&
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
  function canFish() {
    const support = fishingSupport(context);
    return (
      enabled() &&
      support !== null &&
      distanceToPlace(context.player.position, FISHING_SHORE) <= 5.5 &&
      Math.abs(context.player.position.y - support.shore) < 2.5
    );
  }
  function canHang() {
    const heights = lanternSupport(context);
    return (
      enabled() &&
      heights !== null &&
      distanceToPlace(context.player.position, WISH_GROVE) <= 6 &&
      Math.abs(context.player.position.y - (heights[0] + heights[1]) / 2) < 2.5
    );
  }
  function cancel() {
    if (phase !== "idle")
      message =
        phase === "caught"
          ? "Your fish was gently returned to the lake. Its discovery is saved in your collection."
          : "The cast has been put away. Open the journal at the shore to try again.";
    phase = "idle";
    remaining = 0;
    catchName = "";
  }
  window.addEventListener("blur", cancel, { signal: listeners.signal });
  document.addEventListener(
    "visibilitychange",
    () => {
      if (document.hidden) cancel();
    },
    { signal: listeners.signal },
  );
  return {
    get status() {
      return {
        phase,
        remaining,
        catchName,
        message,
        canFish: canFish(),
        canHang: canHang(),
        fishSupported: fishingSupport(context) !== null,
        lanternSupported: lanternSupport(context) !== null,
        fish: progress.state.fish,
        lanterns: progress.state.lanterns,
        available: progress.available,
      };
    },
    fish() {
      if (!canFish()) return;
      if (phase === "idle") {
        phase = "waiting";
        remaining = 3.2 + (progress.state.catches % 3) * 0.4;
        message = "Your bobber is afloat. Watch it gently bob…";
        context.water?.ripple?.(FISHING_BOBBER.x, FISHING_BOBBER.z, 0.45);
      } else if (phase === "waiting") {
        cancel();
        message = "A little too early! Give the fish time to nibble, then reel.";
      } else if (phase === "nibble") {
        const name = FISH_SPECIES[progress.state.catches % FISH_SPECIES.length];
        if (!progress.catchFish(name)) return;
        report("");
        catchName = name;
        phase = "caught";
        remaining = 0;
        message = `You caught a ${name}! Its discovery is saved. Gently release it when you are ready.`;
        context.hud?.toast(`≈ Discovered ${name} · ${progress.state.fish.length}/3 fish`);
      } else if (phase === "caught") {
        context.water?.splash?.(FISHING_BOBBER, 0.3);
        cancel();
        message =
          "Released with a little splash. Thank you, little fish! Cast again whenever you like.";
      }
    },
    hang(wish) {
      if (!canHang() || !progress.hang(wish)) return;
      report("");
      context.hud?.toast(`✧ A wish for ${wish.toLowerCase()} is glowing in the grove.`);
    },
    update(dt) {
      const ready = expansionRestored(context);
      const support = ready ? fishingSupport(context) : null;
      if (phase !== "idle" && !canFish()) cancel();
      if (phase === "waiting" || phase === "nibble") {
        remaining -= Math.max(0, Math.min(0.1, dt));
        if (remaining <= 0 && phase === "waiting") {
          phase = "nibble";
          remaining = 4;
          message = "Nibble! The bobber is dipping — reel now!";
          context.water?.ripple?.(FISHING_BOBBER.x, FISHING_BOBBER.z, 0.6);
        } else if (remaining <= 0) {
          cancel();
          message = "The fish slipped away. Cast again and reel during the next nibble.";
        }
      }
      fishingModel.update(support, phase, catchName);
      lanternModel.update(ready ? lanternSupport(context) : null, progress.state.lanterns);
    },
    dispose() {
      disposed = true;
      listeners.abort();
      cancel();
      fishingModel.dispose();
      lanternModel.dispose();
    },
  };
}
