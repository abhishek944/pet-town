import { installGameStyles } from "../../core/install-game-styles.js";
import { createJournalInput } from "./input.js";
import { updateGardenJournal } from "./garden-journal.js";
import { getTrailPlaces, distanceToPlace, expansionRestored } from "./places.js";
import { createWillowmereJournal } from "../willowmere/journal.js";
import { createShellhavenJournal } from "../shellhaven/journal.js";
import { journalTemplate } from "./journal-template.js";
import { createJournalPages } from "./journal-pages.js";
import { createJournalPlaces } from "./journal-places.js";
import { createJournalExperiences } from "./journal-experiences.js";
import { createJournalCollection } from "./journal-collection.js";
import styles from "./assets/journal.css?raw";

export function createTrailJournal(context, progress, actions) {
  const places = getTrailPlaces(context);
  installGameStyles("sunmeadow-journal-css", styles);
  const root = document.createElement("div");
  root.className = "sunmeadow-ui";
  root.dataset.townUi = "trail";
  root.innerHTML = journalTemplate(actions);
  const query = (selector) => root.querySelector(selector);
  const toggle = query(".sunmeadow-toggle");
  const overlay = query(".sunmeadow-overlay");
  const close = query(".sunmeadow-close");
  const pages = createJournalPages(root);
  const willowmere = actions.willowmere
    ? createWillowmereJournal(
        query("[data-willowmere-activities]"),
        actions.willowmere,
        query("[data-willowmere-collection]"),
      )
    : null;
  const shellhaven = actions.shellhaven
    ? createShellhavenJournal(
        query("[data-shellhaven-activities]"),
        actions.shellhaven,
        query("[data-shellhaven-collection]"),
      )
    : null;
  function heading(id) {
    if (!expansionRestored(context) || !context.water?.exploration?.setHeading(id)) return;
    setOpen(false);
    context.hud?.toast("Heading set. Follow the compass and swim at your own pace.");
  }
  const destinations = createJournalPlaces(context, root, progress, places, actions, heading);
  const experiences = createJournalExperiences(context, root, places, heading);
  const collection = createJournalCollection(context, root, progress, places);
  query("[data-fishing-reminder]").onclick = () => {
    pages.select("experiences");
    const fish = query("[data-fishing]");
    (fish?.disabled ? query("[data-fishing-card]") : fish)?.focus();
    query("[data-fishing-card]")?.scrollIntoView({ block: "nearest" });
  };
  for (const button of root.querySelectorAll("[data-find-place]")) {
    button.onclick = () => {
      pages.select("places");
      destinations.focus(button.dataset.findPlace);
    };
  }
  document.body.append(root);
  let open = false;
  let returnFocus;
  function available() {
    return (
      !document.hidden &&
      !context.hud?.blocking &&
      !context.hud?.hidden &&
      !context.hud?.photoMode &&
      !context.petTown?.panel?.open &&
      !context.petTown?.terminal?.inputActive &&
      !context.worldAssets?.libraryOpen
    );
  }
  const input = createJournalInput(context, root, {
    available,
    key: pages.key,
    toggle: () => setOpen(!open),
    close: () => setOpen(false),
  });
  function setOpen(value, restoreFocus = true) {
    if (value && !available()) return;
    if (value === open) return;
    open = value;
    input.setActive(value);
    overlay.hidden = !value;
    toggle.setAttribute("aria-expanded", String(value));
    if (value) {
      returnFocus = document.activeElement;
      close.focus();
    } else if (restoreFocus && !context.hud?.blocking) {
      if (returnFocus?.isConnected && returnFocus !== document.body) returnFocus.focus();
      else toggle.focus();
    }
  }
  toggle.onclick = () => setOpen(!open);
  close.onclick = () => setOpen(false);
  overlay.onclick = (event) => {
    if (event.target === overlay) setOpen(false);
  };
  query("[data-garden]").onclick = actions.garden;
  query("[data-photo]").onclick = () => {
    setOpen(false, false);
    context.hud?.photo();
  };
  return {
    get isOpen() {
      return open;
    },
    setOpen,
    error(message) {
      const element = query("[data-error]");
      element.hidden = !message;
      element.textContent = message;
    },
    update() {
      root.style.width = `${context.viewport?.width ?? innerWidth}px`;
      const visible = available();
      if (!visible && open) setOpen(false, false);
      root.hidden = !visible;
      root.inert = !visible;
      if (!open) return;
      const api = context.water?.exploration;
      const land = progress.state.stamps.length;
      const sea = api?.discoveries.length ?? 0;
      const total = places.length + (api?.places.length ?? 0);
      query("[data-progress]").textContent =
        `${land + sea} / ${total} places discovered · ${land} trail${api ? ` · ${sea} ocean` : ""}`;
      query("progress").max = total;
      query("progress").value = land + sea;
      query("[data-ocean-error]").hidden = !api?.error;
      query("[data-ocean-error]").textContent = api?.error ?? "";
      destinations.update();
      experiences.update();
      collection.update();
      updateGardenJournal(context, progress, query, expansionRestored(context));
      willowmere?.update();
      shellhaven?.update();
      const phase = actions.willowmere?.status.phase;
      const reminder = query("[data-fishing-reminder]");
      reminder.hidden = !phase || phase === "idle" || pages.selected === "experiences";
      const message =
        phase === "nibble"
          ? "A fish is nibbling! Return to fishing to reel now."
          : phase === "caught"
            ? "Your fish is waiting. Return to fishing to gently release it."
            : "Your line is cast. Return to fishing to watch for a nibble.";
      if (reminder.textContent !== message) reminder.textContent = message;
      const nearest = places.find((place) => distanceToPlace(context.player.position, place) <= 8);
      query("[data-photo-note]").textContent =
        nearest?.note ??
        "Cloudrest Lookout has the widest panorama. Orbit the camera, then save a keepsake with photo mode.";
    },
    dispose() {
      input.dispose();
      root.remove();
    },
  };
}
