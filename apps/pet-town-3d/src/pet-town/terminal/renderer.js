import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { layoutTerminal } from "./layout.js";
import { createServerSurface } from "./server-surface.js";
import { terminalDocument } from "./document.js";

/** Render the existing ANSI grid; never turn output into HTML or invent a prompt. */
export function createTerminalRenderer(
  view,
  { onInput, onResize, onFailure, onCommand, onNotice },
) {
  const terminal = new Terminal({
    documentOverride: terminalDocument(),
    cols: 80,
    rows: 24,
    allowTransparency: true,
    disableStdin: true,
    fontFamily: "Menlo, ui-monospace, monospace",
    fontSize: 12.5,
    lineHeight: 1.6,
    cursorBlink: false,
    scrollback: 0,
    screenReaderMode: true,
    theme: {
      background: "#00000000",
      foreground: "#e4ebdc",
      cursor: "#c5dac0",
      green: "#bdebb1",
      yellow: "#eddaa0",
      magenta: "#d6c6ed",
    },
  });
  const fit = new FitAddon();
  terminal.loadAddon(fit);
  terminal.open(view.fields.screen);
  terminal.textarea?.setAttribute("aria-label", "Existing Herdr terminal input");
  // Keep xterm's readable row tree, without announcing every streamed line.
  view.fields.screen.querySelector(".live-region")?.setAttribute("aria-live", "off");
  let disposed = false,
    sequence = null,
    writing = false,
    failed = false;
  let queue = [],
    queuedBytes = 0,
    lastSize = "",
    inputEnabled = false;
  const surface = createServerSurface(view, terminal, {
    enabled: () => inputEnabled && !disposed && !failed,
    send: onCommand,
    onNotice,
    onFailure: fail,
    onLayout: anchor,
  });
  const subscriptions = [terminal.onData(onInput)];
  function anchor() {
    if (disposed) return;
    layoutTerminal(view, terminal, surface.state);
  }
  function fail(message) {
    if (failed || disposed) return;
    failed = true;
    queue = [];
    queuedBytes = 0;
    terminal.options.disableStdin = true;
    onFailure(message);
  }
  function drain() {
    if (disposed || writing || !queue.length || failed) return;
    const frame = queue.shift();
    queuedBytes -= frame.bytes.length;
    writing = true;
    if (frame.full) terminal.reset();
    terminal.resize(frame.width, frame.height);
    let bytes;
    try {
      bytes = Uint8Array.from(atob(frame.bytes), (char) => char.charCodeAt(0));
    } catch {
      writing = false;
      fail("Terminal output was unreadable. Reconnect to refresh it.");
      return;
    }
    if (bytes.length > 1_048_576) {
      writing = false;
      fail("Terminal output exceeded the supported frame limits.");
      return;
    }
    terminal.write(bytes, () => {
      writing = false;
      if (disposed) return;
      anchor();
      drain();
    });
  }
  function resize() {
    if (disposed || !view.fields.viewport.clientHeight) return;
    const size = fit.proposeDimensions();
    if (size && size.cols >= 2 && size.rows >= 1) {
      const key = `${size.cols}:${size.rows}`;
      if (key !== lastSize) {
        lastSize = key;
        onResize(size);
      }
    }
    anchor();
  }
  subscriptions.push(terminal.onRender(anchor));
  const observer = new ResizeObserver(resize);
  observer.observe(view.fields.viewport);
  return {
    frame(frame) {
      if (disposed || failed) return;
      if (
        !Number.isInteger(frame.seq) ||
        !Number.isInteger(frame.width) ||
        !Number.isInteger(frame.height) ||
        frame.width < 2 ||
        frame.width > 512 ||
        frame.height < 1 ||
        frame.height > 256 ||
        typeof frame.bytes !== "string" ||
        frame.bytes.length > 1_398_104
      ) {
        fail("Terminal output exceeded the supported frame limits.");
        return;
      }
      if (!frame.full && sequence === null) {
        fail("Terminal output lost its place. Reconnect before typing.");
        return;
      }
      if (sequence !== null && frame.seq <= sequence) return;
      sequence = frame.seq;
      if (queue.length >= 32 || queuedBytes + frame.bytes.length > 8_000_000) {
        fail("Terminal output is arriving too quickly. Reconnect to refresh it.");
        return;
      }
      queue.push(frame);
      queuedBytes += frame.bytes.length;
      drain();
    },
    reset() {
      failed = false;
      sequence = null;
      queue = [];
      queuedBytes = 0;
      terminal.reset();
    },
    setInput(enabled) {
      inputEnabled = enabled;
      terminal.options.disableStdin = !enabled;
      surface.reset();
      if (enabled) lastSize = "";
    },
    dimensions() {
      return fit.proposeDimensions() || { cols: 80, rows: 24 };
    },
    refresh: resize,
    focus() {
      terminal.focus();
    },
    blur() {
      terminal.blur();
    },
    dispose() {
      disposed = true;
      surface.dispose();
      observer.disconnect();
      for (const subscription of subscriptions) subscription.dispose();
      terminal.dispose();
    },
  };
}
