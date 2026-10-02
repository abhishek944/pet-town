/** Coalesce wheel/drag bursts without accumulating an unbounded native-command backlog. */
export function createSurfaceQueue(send, enabled, onFailure) {
  let disposed = false,
    sending = false,
    timer = 0,
    queue = [];
  async function drain() {
    if (disposed || sending || !enabled()) return;
    sending = true;
    while (!disposed && enabled() && queue.length) {
      const command = queue.shift();
      if (!(await send(command))) {
        queue = [];
        break;
      }
    }
    sending = false;
  }
  function enqueue(command, immediate = false) {
    if (disposed || !enabled()) return;
    const previous = queue.at(-1);
    if (
      command.type === "terminal.scroll" &&
      previous?.type === command.type &&
      previous.direction === command.direction &&
      previous.column === command.column &&
      previous.row === command.row &&
      previous.modifiers === command.modifiers
    ) {
      previous.lines = Math.min(65535, previous.lines + command.lines);
    } else if (
      command.action === "drag" &&
      previous?.action === "drag" &&
      previous.button === command.button
    ) {
      queue[queue.length - 1] = command;
    } else if (queue.length >= 32) {
      clear();
      onFailure("Terminal pointer input exceeded its buffer. Reconnect before interacting.");
      return;
    } else queue.push(command);
    if (immediate) {
      clearTimeout(timer);
      timer = 0;
      void drain();
    } else if (!timer)
      timer = window.setTimeout(() => {
        timer = 0;
        void drain();
      }, 60);
  }
  function clear() {
    clearTimeout(timer);
    timer = 0;
    queue = [];
  }
  return {
    enqueue,
    clear,
    dispose() {
      disposed = true;
      clear();
    },
  };
}
