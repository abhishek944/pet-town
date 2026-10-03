/** Adapt the existing world/help dialog for visitors without desktop agents. */
export function configurePublicSettings(root) {
  root.querySelector('[data-tab="companion"]').remove();
  root.querySelector('[data-panel="companion"]').remove();
  root.querySelector('[data-tab="about"]')?.remove();
  root.querySelector('[data-panel="about"]')?.remove();
  root.querySelector(".settings-header p").textContent = "World sound, building and help.";
  root.querySelector(".setting-row p").textContent = "Music, ambience and effects.";
  for (const row of root.querySelectorAll(".guide-row")) {
    if (["Call Mayor", "Cycle companions"].includes(row.querySelector("span")?.textContent)) {
      row.remove();
    }
  }
  root.querySelector(".touch-guide").textContent =
    "Touch: use the stick to walk; push to its rim to run. Tap Jump or hold it to glide. " +
    "Drag to look, pinch to zoom, tap to place a block, and hold to break one. " +
    "Swipe the material bar to see every block. Tap an animal’s bubble to pet it. " +
    "Undo and Redo are beside Back to Pet Town.";
  root.querySelector(".touch-guide").style.display = "block";
  const world = root.querySelector('[data-tab="world"]');
  world.setAttribute("aria-selected", "true");
  world.tabIndex = 0;
  root.querySelector('[data-panel="world"]').hidden = false;
  return { render() {} };
}
