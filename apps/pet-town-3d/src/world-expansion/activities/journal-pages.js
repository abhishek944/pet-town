export function createJournalPages(root) {
  const tabs = [...root.querySelectorAll("[role=tab]")];
  let selected = "experiences";
  function select(id) {
    if (!tabs.some((tab) => tab.dataset.page === id)) return;
    if (selected !== id) root.querySelector("[data-trail-dialog]").scrollTop = 0;
    selected = id;
    for (const tab of tabs) {
      const active = tab.dataset.page === id;
      tab.setAttribute("aria-selected", String(active));
      tab.tabIndex = active ? 0 : -1;
      root.querySelector(`#${tab.getAttribute("aria-controls")}`).hidden = !active;
    }
  }
  tabs.forEach((tab) => {
    tab.onclick = () => select(tab.dataset.page);
  });
  return {
    select,
    get selected() {
      return selected;
    },
    key(event) {
      const current = tabs.indexOf(document.activeElement);
      if (current < 0 || !["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.code))
        return false;
      const index =
        event.code === "Home"
          ? 0
          : event.code === "End"
            ? tabs.length - 1
            : (current + (event.code === "ArrowLeft" ? -1 : 1) + tabs.length) % tabs.length;
      select(tabs[index].dataset.page);
      tabs[index].focus();
      return true;
    },
  };
}
