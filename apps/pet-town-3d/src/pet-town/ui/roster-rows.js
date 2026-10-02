import { createPortrait, companionStatus, companionNames } from "./portrait.js";

/** Keep DOM nodes alive while snapshots change, preserving focus and scroll. */
export function createRosterRows(container, onSelect, onRemovedFocus) {
  const rows = new Map();
  return (records, selected) => {
    const names = companionNames(records);
    for (const [id, row] of rows) {
      if (records.has(id)) continue;
      const focused = row.button.contains(document.activeElement);
      row.button.remove();
      rows.delete(id);
      if (focused) onRemovedFocus();
    }
    let index = 0;
    for (const record of [...records.values()].sort((a, b) => a.id.localeCompare(b.id))) {
      let row = rows.get(record.id);
      if (!row) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "town-entry";
        button.innerHTML = `<span class="town-identity-row"><strong></strong><span class="town-work-state"><i aria-hidden="true"></i><span></span></span></span><span class="town-following"><b aria-hidden="true">✓</b>Following</span>`;
        button.prepend(createPortrait(record));
        button.onclick = () => onSelect(record.id);
        row = {
          button,
          petId: record.petId,
          name: button.querySelector("strong"),
          status: button.querySelector(".town-work-state span"),
          state: button.querySelector(".town-work-state"),
          following: button.querySelector(".town-following"),
        };
        rows.set(record.id, row);
      }
      if (row.petId !== record.petId) {
        row.button.querySelector(".town-portrait")?.replaceWith(createPortrait(record));
        row.petId = record.petId;
      }
      if (container.children[index] !== row.button) {
        container.insertBefore(row.button, container.children[index] ?? null);
      }
      index++;
      const following = record.id === selected?.id;
      const status = companionStatus(record);
      row.name.textContent = names.get(record.id);
      row.status.textContent = status;
      row.state.dataset.status = record.status;
      row.following.hidden = !following;
      row.button.setAttribute("aria-pressed", String(following));
      row.button.setAttribute(
        "aria-label",
        `${names.get(record.id)}, ${status}, ${following ? "following" : "follow"}`,
      );
    }
  };
}
