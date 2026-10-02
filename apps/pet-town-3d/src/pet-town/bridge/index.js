import { invoke } from "@tauri-apps/api/core";

const BROWSER_MESSAGE = "Open Pet Town desktop to connect your agents and Mayor.";
const hasNativeBridge = () => Boolean(window.__TAURI_INTERNALS__);

/** Read the desktop's public snapshot; never manufacture an agent roster. */
export function createTownBridge({ onSnapshot, onConnection }) {
  let disposed = false;
  let started = false;
  let polling = null;
  let timer = 0;
  let failures = 0;
  let refreshRequested = false;
  let connectionKey = "";
  let actionRevision = 0;

  function connection(connected, message) {
    if (disposed) return;
    const key = `${connected}:${message}`;
    if (connectionKey === key) return;
    connectionKey = key;
    onConnection?.({ connected, message });
  }

  function schedule(delay) {
    clearTimeout(timer);
    if (started && !disposed) timer = window.setTimeout(refresh, delay);
  }

  async function readSnapshot() {
    if (!hasNativeBridge()) {
      connection(false, BROWSER_MESSAGE);
      return;
    }
    let snapshot;
    const revision = actionRevision;
    try {
      snapshot = await invoke("get_town_snapshot");
      if (snapshot?.v !== 1 || snapshot.type !== "snapshot" || !Array.isArray(snapshot.agents)) {
        throw new Error("Pet Town returned an unsupported snapshot.");
      }
    } catch (error) {
      if (disposed || revision !== actionRevision) return;
      failures += 1;
      connection(false, `Pet Town connection unavailable. ${String(error)}`);
      return;
    }
    // Discard reads started before a native action completed, including its acknowledgement.
    if (disposed || revision !== actionRevision) return;
    failures = 0;
    connection(
      true,
      snapshot.available
        ? "Connected to Pet Town"
        : "Pet Town connected · agent service unavailable",
    );
    onSnapshot?.(snapshot);
  }

  function refresh() {
    if (disposed || !started) return Promise.resolve();
    clearTimeout(timer);
    if (polling) {
      refreshRequested = true;
      return polling;
    }
    polling = readSnapshot().finally(() => {
      polling = null;
      const delay = !hasNativeBridge()
        ? 10_000
        : failures
          ? Math.min(10_000, 500 * 2 ** Math.min(failures, 5))
          : document.hidden
            ? 2500
            : 500;
      schedule(refreshRequested ? 0 : delay);
      refreshRequested = false;
    });
    return polling;
  }

  function start() {
    if (disposed) return Promise.resolve();
    started = true;
    failures = 0;
    return refresh();
  }

  async function action(name, args = {}) {
    // A pending microphone start must still be releasable during teardown.
    const releasingMicrophone = name === "mayorTalk" && args.active === false;
    if (disposed && !releasingMicrophone) throw new Error("Pet Town connection is closed.");
    if (!hasNativeBridge()) throw new Error(BROWSER_MESSAGE);
    actionRevision += 1;
    try {
      return await invoke("town_action", { ...args, action: name });
    } finally {
      actionRevision += 1;
      if (!disposed && started) {
        if (polling) refreshRequested = true;
        else schedule(0);
      }
    }
  }

  function onVisibility() {
    if (!document.hidden && started) void refresh();
  }
  document.addEventListener("visibilitychange", onVisibility);
  return {
    start,
    action,
    dispose() {
      disposed = true;
      started = false;
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    },
  };
}
