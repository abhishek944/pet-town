/** Uniform ANSI background paint is the terminal plane, not a meaningful blank row. */
function normalRows(terminal, buffer) {
  const backgrounds = new Map();
  const key = (cell) => `${cell?.getBgColorMode() || 0}:${cell?.getBgColor() || 0}`;
  for (let row = 0; row < terminal.rows; row++) {
    const line = buffer.getLine(buffer.baseY + row);
    for (let col = 0; line && col < line.length; col++) {
      const cell = line.getCell(col);
      if (!cell?.getChars().trim()) {
        const background = key(cell);
        backgrounds.set(background, (backgrounds.get(background) || 0) + 1);
      }
    }
  }
  const plane = [...backgrounds].sort((a, b) => b[1] - a[1])[0]?.[0] || "0:0";
  let used = buffer.cursorY + 1;
  for (let row = terminal.rows - 1; row >= used; row--) {
    const line = buffer.getLine(buffer.baseY + row);
    for (let col = 0; line && col < line.length; col++) {
      const cell = line.getCell(col);
      if (cell?.getChars().trim() || key(cell) !== plane) return row + 1;
    }
  }
  return used;
}

export function layoutTerminal(view, terminal, { history, originalGrid }) {
  const buffer = terminal.buffer.active;
  view.controls.live.hidden = !history;
  const used = !originalGrid && !history ? normalRows(terminal, buffer) : terminal.rows;
  const screenBounds = view.fields.screen.querySelector(".xterm-screen")?.getBoundingClientRect();
  const cellHeight = screenBounds?.height / terminal.rows || 20;
  terminal.element.style.minWidth = `${screenBounds?.width || 0}px`;
  terminal.element.style.minHeight = `${screenBounds?.height || 0}px`;
  const tall = used * cellHeight > view.fields.viewport.clientHeight;
  view.fields.viewport.style.overflowY = tall || originalGrid ? "auto" : "hidden";
  if (tall && !history && !originalGrid)
    view.fields.viewport.scrollTop = used * cellHeight - view.fields.viewport.clientHeight;
  const offset =
    !originalGrid && !history
      ? Math.max(0, view.fields.viewport.clientHeight - used * cellHeight)
      : 0;
  view.fields.screen.style.transform = `translateY(${Math.floor(offset)}px)`;
}
