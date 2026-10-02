import { Channel, invoke } from "@tauri-apps/api/core";

/** Generation guards also cover events arriving before invoke returns its token. */
export function createTerminalSession({ onEvent, onError }) {
  let generation = 0,
    token = null,
    ready = false,
    control = false,
    disposed = false;
  let operations = Promise.resolve(),
    sends = Promise.resolve(),
    input = "",
    timer = 0;
  let queuedInput = 0,
    inputBytes = 0,
    queuedCommands = 0;
  const encoder = new TextEncoder();
  function cancelInput() {
    clearTimeout(timer);
    timer = 0;
    input = "";
    inputBytes = 0;
  }
  async function release(value) {
    if (value) await invoke("town_terminal_close", { token: value }).catch(() => {});
  }
  function stop() {
    generation++;
    ready = false;
    control = false;
    cancelInput();
    const previous = token;
    token = null;
    operations = operations.then(() => release(previous));
  }
  function send(command) {
    if (!ready || !control || !token || disposed) return Promise.resolve(false);
    const current = generation,
      owner = token;
    const length = command.type === "terminal.input" ? encoder.encode(command.text).length : 0;
    if (queuedInput + length > 128_000 || queuedCommands >= 64) {
      stop();
      onError("Input is arriving faster than the terminal can accept. Reconnect before typing.");
      return Promise.resolve(false);
    }
    queuedInput += length;
    queuedCommands++;
    sends = sends.then(async () => {
      queuedInput -= length;
      queuedCommands--;
      if (current !== generation || !ready || !control || owner !== token) return false;
      try {
        await invoke("town_terminal_send", { token: owner, command });
        return current === generation && owner === token && ready;
      } catch (error) {
        if (current !== generation || disposed) return false;
        stop();
        onError(`Input failed; delivery may be unknown. Nothing was resent. ${String(error)}`);
        return false;
      }
    });
    return sends;
  }
  function flush() {
    clearTimeout(timer);
    timer = 0;
    const text = input;
    input = "";
    inputBytes = 0;
    if (text) send({ type: "terminal.input", text });
  }
  return {
    attach(id, size, requestedControl, takeover = false) {
      stop();
      const current = generation;
      onEvent({
        type: "status",
        state: "connecting",
        control: requestedControl,
        message: "Connecting to the existing session",
      });
      operations = operations.then(async () => {
        if (disposed || current !== generation) return;
        if (!window.__TAURI_INTERNALS__) {
          onEvent({
            type: "status",
            state: "disconnected",
            control: false,
            message: "Open Pet Town desktop to view the existing Herdr terminal.",
          });
          return;
        }
        const onEventChannel = new Channel();
        let accepting = false,
          overflow = false;
        const pending = [];
        const deliver = (event) => {
          if (disposed || current !== generation) return;
          if (event.type === "status") {
            ready = event.state === "ready";
            control = ready && event.control;
            if (!ready) cancelInput();
          }
          onEvent(event);
        };
        onEventChannel.onmessage = (event) => {
          if (accepting) deliver(event);
          else if (pending.length < 64) pending.push(event);
          else overflow = true;
        };
        try {
          const result = await invoke("town_terminal_open", {
            id,
            cols: size.cols,
            rows: size.rows,
            control: requestedControl,
            takeover,
            onEvent: onEventChannel,
          });
          if (disposed || current !== generation) await release(result.token);
          else {
            token = result.token;
            accepting = true;
            if (overflow) {
              ready = false;
              control = false;
              onEvent({
                type: "status",
                state: "disconnected",
                control: false,
                message: "Terminal output overflowed while connecting. Reconnect to refresh it.",
              });
              await release(token);
              token = null;
            } else pending.forEach(deliver);
          }
        } catch (error) {
          if (disposed || current !== generation) return;
          accepting = true;
          pending.forEach(deliver);
          ready = false;
          control = false;
          if (!pending.some((event) => event.state === "conflict"))
            onEvent({
              type: "status",
              state: "disconnected",
              control: false,
              message: String(error),
            });
        }
      });
      return operations;
    },
    input(text) {
      if (!ready || !control || !token || disposed) return;
      const bytes = encoder.encode(text).length;
      if (bytes + inputBytes + queuedInput > 128_000) {
        stop();
        onError(
          "This paste exceeded the input buffer and was not submitted. Reconnect and paste a smaller selection.",
        );
        return;
      }
      // Clipboard paste bypasses this keyboard buffer so its complete wrapper stays atomic.
      for (const character of text) {
        const length = encoder.encode(character).length;
        if (inputBytes + length > 48_000) flush();
        input += character;
        inputBytes += length;
      }
      if (!timer) timer = window.setTimeout(flush, 60);
    },
    send(command) {
      flush();
      return send(command);
    },
    resize(size) {
      send({ type: "terminal.resize", ...size });
    },
    close: stop,
    dispose() {
      disposed = true;
      stop();
      return operations;
    },
  };
}
