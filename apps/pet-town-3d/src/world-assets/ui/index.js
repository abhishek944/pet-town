import { installGameStyles } from "../../core/install-game-styles.js";
import { WORLD_ASSETS } from "../../props/collection/catalog.js";
import { createLibraryView } from "./view.js";
import { createLibraryInput } from "./input.js";
import { createLibraryPreview } from "./preview.js";
import styles from "./library.css?raw";

export function createAssetLibrary(context, controller) {
  installGameStyles("world-asset-library-css", styles);
  const { root, query, cards } = createLibraryView((id) => {
    controller.select(id);
    query("[data-result]").textContent = "";
    sync();
  });
  const preview = createLibraryPreview(query("[data-preview]"));
  let open = false;
  let returnFocus;
  let selectedId;
  let targetSignature;
  function available() {
    const trail = document.querySelector(".sunmeadow-overlay:not([hidden])");
    return (
      !document.hidden &&
      !context.hud?.blocking &&
      !context.hud?.hidden &&
      !context.hud?.photoMode &&
      !context.petTown?.panel?.open &&
      !context.petTown?.terminal?.inputActive &&
      !(trail && !trail.closest("[hidden]"))
    );
  }
  function setOpen(value, restoreFocus = true) {
    if ((value && !available()) || value === open) return;
    open = value;
    context.worldAssets.libraryOpen = value;
    if (value) returnFocus = document.activeElement;
    input.setActive(value);
    controller.setActive(value);
    query(".asset-library-overlay").hidden = !value;
    query(".asset-library-toggle").setAttribute("aria-expanded", String(value));
    if (value) {
      query("[data-close]").focus();
      sync();
    } else if (restoreFocus && available()) {
      if (returnFocus?.isConnected && returnFocus !== document.body) returnFocus.focus();
      else query(".asset-library-toggle").focus();
    }
  }
  const input = createLibraryInput(context, root, {
    available,
    toggle: () => setOpen(!open),
    close: (restoreFocus) => setOpen(false, restoreFocus),
    handoff(code) {
      setOpen(false, false);
      if (code === "KeyH") context.hud?.toggleHelp();
      else context.hud?.photo();
    },
  });
  query(".asset-library-toggle").onclick = () => setOpen(!open);
  query("[data-close]").onclick = () => setOpen(false);
  query(".asset-library-overlay").onclick = (event) => {
    if (event.target === query(".asset-library-overlay")) setOpen(false);
  };
  query("[data-turn]").onclick = () => {
    controller.rotate();
    sync();
  };
  query("[data-distance]").oninput = (event) => {
    controller.setDistance(Number(event.target.value));
    sync();
  };
  query("[data-target]").onchange = (event) => {
    controller.setTarget(event.target.value || null);
    sync();
  };
  for (const [action, message] of [
    ["add", "Asset added. Close the library to walk around it."],
    ["replace", "Selected asset replaced."],
    ["restore", "The original asset has been restored at this spot."],
    ["undo", "Latest asset change undone."],
  ])
    query(`[data-${action}]`).onclick = () => {
      const changed = controller[action]();
      query("[data-result]").textContent = changed ? message : "";
      sync();
      if (changed && action === "restore") query("[data-target]").focus();
    };
  function sync() {
    const state = controller.state;
    const asset = WORLD_ASSETS.find((item) => item.id === state.selectedId);
    if (selectedId !== state.selectedId) {
      selectedId = state.selectedId;
      for (const { asset: item, card } of cards) {
        card.setAttribute("aria-pressed", String(item.id === selectedId));
      }
      query("[data-name]").textContent = asset?.name ?? "Choose an asset";
      query("[data-preview]").setAttribute(
        "aria-label",
        `${asset?.name ?? "Selected asset"} 3D preview`,
      );
      query("[data-footprint]").textContent = asset
        ? `${asset.category} · Needs about ${Math.ceil(asset.hw * 2)} × ${Math.ceil(asset.hd * 2)} metres of clear ground.`
        : "";
    }
    query("[data-angle]").textContent =
      `${Math.round(((state.rotation ?? 0) * 180) / Math.PI) % 360}°`;
    query("[data-distance]").value = state.distance;
    query("[data-distance-label]").textContent = `${state.distance}m`;
    const signature = JSON.stringify(state.targets);
    if (signature !== targetSignature) {
      targetSignature = signature;
      query("[data-target]").replaceChildren(new Option("New asset: use the spot ahead", ""));
      for (const target of state.targets ?? [])
        query("[data-target]").add(new Option(target.name, target.key));
    }
    query("[data-target]").value = state.targetKey ?? "";
    const target = state.targets?.find((item) => item.key === state.targetKey);
    query("[data-target-detail]").textContent = target ? `Selected spot: ${target.name}` : "";
    query("[data-target-detail]").hidden = !target;
    query("[data-placement]").textContent =
      state.placementNote ?? "Check the highlighted spot in the world.";
    query("[data-add]").disabled = !asset || Boolean(state.targetKey) || !state.placementValid;
    query("[data-replace]").disabled = !asset || !state.targetKey || !state.placementValid;
    query("[data-undo]").disabled = !state.canUndo;
    query("[data-restore]").hidden = !state.canRestore;
    query("[data-restore]").disabled = !state.canRestore;
    query("[data-error]").textContent = state.error ?? "";
    query("[data-error]").hidden = !state.error;
    if (open) preview.update(asset, state.rotation ?? 0);
  }
  return {
    get isOpen() {
      return open;
    },
    update() {
      root.style.width = `${context.viewport?.width ?? innerWidth}px`;
      if (!available() && open) setOpen(false, false);
      root.hidden = !available();
      root.inert = root.hidden;
      controller.update();
      if (open) sync();
    },
    dispose() {
      setOpen(false, false);
      input.dispose();
      preview.dispose();
      root.remove();
    },
  };
}
